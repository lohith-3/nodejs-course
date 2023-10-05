const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHanlder = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// GLOBAL MIDDLEWARES
if (process.env.NODE_ENV.toLocaleLowerCase() === 'development') {
  app.use(morgan('dev'));
}

// So basically what the rate limiter is gonna do
// is to count the numbers of requests coming from one
// IP and then when there are too many requests block
// these requests

// npm install express-rate-limit

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour',
});

// This will affect all of the routes which will start with /api
app.use('/api', limiter);

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// MIDDLEWARE
// FOR ALL HTTP VERBS
// IF THE INCOMING REQUEST DOESN'T MATCH WITH ANY ROUTE
// THEN THIS MIDDLEWARE CATCHES IT AND PERFROMS THE ACTION

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Failed',
  //   message: `Can't find ${req.url} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.url} on this server!`);
  // err.status = 'Failed';
  // err.statusCode = 404;

  // So if the next function receives an argument
  // no matter what it is, express will automatically
  // know that there was an error.

  // So it will assume that whatever we pass into next
  // is gonna be an error

  // So again whenever we pass anything into next,
  // it will assume that it is an error, and it will
  // then skip all the other middlewares in the middleware
  // stack and sent the error that we passed in to our
  // global error handling middleware which will then be
  // executed

  // next(err);
  next(new AppError(`Can't find ${req.url} on this server!`, 404));
});

// MIDDLEWARE
// To handle the errors

// So define an error handling middleware, all we
// need to do is to give the middleware function
// four arguments and express will then automatically
// recognize it as an error handling middleware and
// therefore only call it when there is an error.

app.use(globalErrorHanlder);

module.exports = app;
