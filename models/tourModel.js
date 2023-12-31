const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'A tour must have a name'],
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW DOCUMENT creation
          // not on update

          // this, variable points to the current document
          // priceDiscount should always be lower than price
          return val < this.price; // 100 < 200 (true) // No Error
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// NDM - Node Debugger Manager
// npm i ndb --global
// Add this script ( "debug": "ndb server.js" ) in package.json

// Validation

// Validation is basically checking if the entered values
// are in the right format for each field in our document
// schema, and also that values have actually been entered
// for all the required fields.

// Virtual Properties

// Now virtual properties are basically fields, that we can
// define on our schema but that will not be persisted.

// So they will not be saved into the database in order to
// save us some space there.

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Document Middleware: runs before .save() and .create()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function (next) {
  console.log('will save the document');
  next();
});

tourSchema.post('save', function (doc, next) {
  console.log(`Document saved sucessfully: ${doc._id}, name: ${doc.name}`);
  next();
});

// Query Middleware

tourSchema.pre(/^find/, function (next) {
  // console.log(this, 'query');
  // this.find({ secretTour: { $eq: false } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs, 'post query');
  console.log(`Query took ${Date.now() - this.start} ms`);
  next();
});

// MIDDLEWARE FOR FINDONE

// tourSchema.pre('findOne', function (next) {
//   this.find({ secretTour: { $eq: true } });
//   next();
// });

// Aggregation Middleware

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $eq: true } } });
  console.log(this, 'aggregate');
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
