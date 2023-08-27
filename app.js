const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');

const app = express();

if (process.env.NODE_ENV.toLocaleLowerCase() === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use('/api/v1/tours', tourRouter);

// MIDDLEWARE
// FOR ALL HTTP VERBS
// IF THE INCOMING REQUEST DOESN'T MATCH WITH ANY ROUTE
// THEN THIS MIDDLEWARE CATCHES IT AND PERFROMS THE ACTION

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'Failed',
    message: `Can't find ${req.url} on this server!`,
  });
});

module.exports = app;
