import bcrypt from "bcryptjs";

import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";

import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  updateUserPassword,
} from "../repositories/user.repo.js";

const AVATAR_COLORS = [
  "#c8b87c",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
];

function pickAvatarColor(seed) {
  const sum = [...seed].reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0
  );

  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password }) {
  if (!name || name.trim().length < 2) {
    throw ApiError.badRequest(
      "Name must be at least 2 characters"
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ApiError.badRequest(
      "Please provide a valid email"
    );
  }

  if (!password || password.length < 6) {
    throw ApiError.badRequest(
      "Password must be at least 6 characters"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    throw ApiError.conflict(
      "An account with this email already exists"
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await createUser({
    name: name.trim(),
    email: normalizedEmail,
    password: hash,
    avatarColor: pickAvatarColor(normalizedEmail),
  });

  const token = signToken({
    id: user.id,
  });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw ApiError.badRequest(
      "Email and password are required"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await findUserByEmail(normalizedEmail, {
    withPassword: true,
  });

  if (!user) {
    throw ApiError.unauthorized(
      "Invalid email or password"
    );
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw ApiError.unauthorized(
      "Invalid email or password"
    );
  }

  const token = signToken({
    id: user.id,
  });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function updateProfile(
  userId,
  { name, avatarColor }
) {
  if (name !== undefined && name !== null) {
    if (name.trim().length < 2) {
      throw ApiError.badRequest(
        "Name must be at least 2 characters"
      );
    }
  }

  const user = await updateUserProfile(
    userId,
    {
      name: name?.trim() || null,
      avatarColor: avatarColor || null,
    }
  );

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toPublicUser(user);
}

export async function changePassword(
  userId,
  { currentPassword, newPassword }
) {
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest(
      "Current and new password are required"
    );
  }

  if (newPassword.length < 6) {
    throw ApiError.badRequest(
      "New password must be at least 6 characters"
    );
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest(
      "New password must be different from current password"
    );
  }

  const user = await findUserById(userId, {
    withPassword: true,
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw ApiError.badRequest(
      "Current password is incorrect"
    );
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    10
  );

  await updateUserPassword(
    userId,
    passwordHash
  );
}

export { toPublicUser };