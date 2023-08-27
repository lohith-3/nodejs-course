const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.get('/api/v1/tours', (req, res, next) => {
  res.send(`<div><h1>Hello, world</h1><p>${req.requestTime}</p></div>`);
});

module.exports = app;
