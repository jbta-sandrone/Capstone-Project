// Centralized Express error handler.
// Keeps API error responses consistent as the backend grows.
export function errorHandler(error, req, res, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;

  res.status(statusCode).json({
    success: false,
    message
  });
}

