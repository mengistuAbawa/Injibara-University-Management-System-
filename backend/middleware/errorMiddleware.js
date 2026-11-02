exports.errorHandler = (err, req, res, next) => {
  process.stderr.write(`${err.stack || err.message || 'Unhandled server error'}\n`);
  res.status(err.statusCode || err.status || 500).json({
    message: err.code === 'ER_DUP_ENTRY' ? 'A record with the same unique value already exists.' : err.message || 'Server Error',
  });
};
