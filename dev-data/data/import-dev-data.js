const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const fs = require('fs');
const Tour = require('../../models/tourModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// mongoose
//   .connect(DB)
//   .then((connection) => {
//     console.log('DB connection successful');
//   })
//   .catch((err) => {
//     console.log(`Error connecting to DB: ${err.message}`);
//   });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// IMPORT DATA INTO COLLECTION (DATABASE)
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('DATA successfully loaded');
    process.exit();
  } catch (err) {
    console.log(`Error in importData: ${err.message}`);
  }
};

// DELETE ALL DATA FROM COLLECTION (DATABASE)
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('DATA successfully deleted');
    process.exit();
  } catch (err) {
    console.log(`Error in deleteData: ${err.message}`);
  }
};

if (process.argv[2] === '--import') {
  // importData();
} else if (process.argv[2] === '--delete') {
  // deleteData();
} else {
  //TODO
}

console.log(process.argv);

// 1) Make sure the dotenv file path is correct
// 2) node (js file path) --import/--delete
// node dev-data/data/import-dev-data.js --import
