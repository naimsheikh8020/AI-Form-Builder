export function sendSuccess (res, {statusCode = 200, message = 'OK', data = null, meta} ={}){
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    ...(meta ? {meta} : {})
  });
}