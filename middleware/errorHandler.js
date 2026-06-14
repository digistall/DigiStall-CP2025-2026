export function errorHandler(err, req, res, next) {
  console.error('❌ Unhandled error:', err)

  if (res.headersSent) {
    return next(err)
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
  })
}

