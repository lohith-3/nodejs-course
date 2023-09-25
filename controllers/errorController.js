const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = (err) => {
  const values = Object.values(err?.keyValue);
  const message = `Duplicate field value: ${values.join(
    ' '
  )}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorsDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJwtError = (err) => {
  return new AppError(`Invalid token. Please log in again`, 401);
};

const handleJwtTokenExpiredError = (err) => {
  return new AppError(`Your token has expired! Please log in again`, 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    name: err.name,
  });
};

const sendErrorProd = (err, res) => {
  console.log(err, ' send error');
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details

    // 1) Log error
    console.error(`Error: ${JSON.stringify(err)}`);

    // 2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV.toLocaleLowerCase() === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV.toLocaleLowerCase() === 'production') {
    let error = JSON.parse(JSON.stringify(err));
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsErrorDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorsDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJwtError(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJwtTokenExpiredError(error);
    }
    sendErrorProd(error, res);
  } else {
  }
};
