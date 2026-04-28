function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  let message;

  if (statusCode >= 500) {
    message = 'Ocurrio un error interno en el servidor';
  } else {
    message = err.message || 'Error no controlado';
  }

  if (res.headersSent) {
    return next(err);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
    });
  }

  return res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message,
    },
  });
}

module.exports = errorHandler;