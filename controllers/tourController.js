exports.getAllTours = (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: {
        name: 'The Hiker Forest',
        duration: 5,
      },
    },
  });
};

exports.createTour = (req, res, next) => {
  res.status(201).json({
    status: 'success',
    data: {
      tour: req.body,
    },
  });
};
