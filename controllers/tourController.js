const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res, next) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      result: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

/*
exports.getAllTours = async (req, res, next) => {
  try {
    let query = Tour.find();
    // console.log(req.query);

    // 127.0.0.1:8000/api/v1/tours?fields=name,duration,difficulty&sort=duration&page=1&limit=3&difficulty=difficult

    // FILTERING
    // 127.0.0.1:8000/api/v1/tours/?difficulty=easy&duration[gte]=5
    const queryObj = { ...req.query };

    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    query = query.find(JSON.parse(queryStr));

    // SORTING
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // LIMITING
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // PAGINATION
    if (req.query.page) {
      const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 3;
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const tours = await query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};
*/

exports.getTour = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tour = await Tour.findById(id);

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

exports.createTour = async (req, res, next) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

exports.updateTour = async (req, res, next) => {
  try {
    const id = req.params.id;

    const tour = await Tour.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

exports.deleteTour = async (req, res, next) => {
  try {
    const id = req.params.id;
    const tour = await Tour.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

// Aggregation
// https://studio3t.com/knowledge-base/articles/mongodb-aggregation-framework/

exports.getTourStats = async (req, res, next) => {
  try {
    // const stats = await Tour.aggregate([
    //   { $match: { ratingsAverage: { $gte: 4.5 } } },
    //   {
    //     $project: {
    //       _id: 0,
    //       name: 1,
    //       price: 1,
    //       ratingsAverage: 1,
    //       summary: 1,
    //       difficulty: 1,
    //     },
    //   },
    //   {
    //     $group: { _id: { $toUpper: '$difficulty' }, totaldocs: { $sum: 1 } },
    //   },
    // ]);
    ///////////////////////////////

    // const stats = await Tour.aggregate([
    //   { $match: { ratingsAverage: { $gte: 4.5 } } },
    //   { $unwind: '$startDates' },
    //   {
    //     $project: {
    //       _id: 0,
    //       name: 1,
    //       price: 1,
    //       ratingsAverage: 1,
    //       summary: 1,
    //       difficulty: 1,
    //     },
    //   },
    //   { $sort: { ratingsAverage: -1 } },
    //   { $limit: 6 },
    //   { $addFields: { greatTours: true } },
    // ]);
    //////////////////////////////////////////

    // const stats = await Tour.aggregate([
    //   { $unwind: '$startDates' },
    //   { $count: 'total_documents' },
    // ]);
    //////////////////////////////////
    // const stats = await Tour.aggregate([{ $sortByCount: '$difficulty' }]);

    //////////////////////////////////////////////

    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numberOfTours: { $sum: 1 },
          numberOfRatings: { $sum: '$ratingsQuantity' },
          averageRating: { $avg: '$ratingsAverage' },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { averagePrice: 1 } },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      result: stats.length,
      data: stats,
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numberOfTourStats: { $sum: 1 },
          tours: {
            $push: '$name',
          },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          numberOfTourStats: 1,
          tours: 1,
        },
      },
      {
        $sort: { numberOfTourStats: -1 },
      },
      {
        $limit: 16,
      },
    ]);

    res.status(200).json({
      status: 'success',
      result: plan.length,
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: err.message,
    });
  }
};
