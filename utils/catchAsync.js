module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

// So let us recap here

// So in order to get rid of our try catch blocks, we
// simply wrapped our asynchronous function inside of
// the catchAsync function that we just created.

// This function will then return a new anonymous function
// which is this one here (return statment), which will then
// be assigned to createTour

// Baically it is that anonymous function (return statment)
// that will get called as soon as newTour should be created
// using the createTour handler.

// And so that's why it has the exact same signature here as
// this async function, with request, response and next. Now
// what this function here will then do (return statement) is
// that it will call the function that we passed in intially (middleware)
// so this (fn), and it will then execute all the code that is in
// there.

// Now since its an async function here, it will return a promise
// and therefore, in case there is an error in this promise or in
// other words, in case it gets rejected. we can then catch the error
// thatb happened using the catch method that is available on all
// promises

// And in the end, it is this catch method here which will pass the
// error into the next function which will then make it so that our
// error ends up in our global error handling middleware.

// This line of code where all magic happens
// ( fn(req, res, next).catch((err) => next(err)) )

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch((err) => next(err));
//   };
// };

// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
// try {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// } catch (err) {
//   res.status(400).json({
//     status: 'Failed',
//     message: err.message,
//   });
// }
//   });
