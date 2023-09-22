const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then((connection) => {
    console.log('DB connection successfull');
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// process.on('unhandledRejection', (err) => {
//   console.log(`UNHANDLER REJECTION! shutting down....`);
//   console.log(`${err.name}, ${err.message}`);
//   // 0: success
//   // 1: uncaught execption
//   server.close(() => {
//     process.exit(1);
//   });
// });

// process.on('uncaughtException', (err) => {
//   console.log(`${err.name}, ${err.message}`);
//   console.log(`UNCAUGHT EXCEPTION! shutting down....`);
//   server.close(() => {
//     process.exit(1);
//   });
// });

// console.log(x);
