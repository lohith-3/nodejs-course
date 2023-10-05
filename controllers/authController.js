const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signInToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signInToken(user._id);

  // So first of all, a cookie is basically just a small piece
  // of text that a server can send to clients, then when the
  // client receives a cookie, it will automatically store it
  // and then automatically send it back along with all future
  // requests to the same server.

  // All right, so again browser automatically stores a cookie
  // that it receives and sends it back in all future requests
  // to that server where it came from

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV.toLocaleLowerCase() === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  // Remove the password from response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything is OK, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError(`You are not logged in! Please log in to get access.`, 401)
    );
  }
  // 2) Validate the token (verification token)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does no longer exist', 401)
    );
  }

  // 4) check if user changed password after the JWT token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant acccess to protected route
  req.user = currentUser;
  next();
});

// Authorization

// So, again with authorization we basically check
// if a certain user is allowed to access a certain
// resource even if he is logged in.

// So not all logged in Users will be able to perform
// the same actions in our API

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // This is a closure
    // roles ['admin', 'lead-guide'].

    // role is just now 'user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

// Password: Reset Functionality: Reset Token

// It works like this, you just have to provide
// your email address and then you will get an
// email with a link where you can click and then
// that is gonna take you to a page where you can
// put in a new password.

// Basically there are two steps

// FOr the first one is that the user sends a post
// request to a forgot password route, only with his
// email address. This will then create a reset token
// and send that to the email address that was provided
// So just a simple, random token, not a JSON web token

// The second part, the user then sends that token from
// his email along with a new password in order to update
// his password

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // This will then de-activate all the validators specified in schema
  await user.save({ validateBeforeSave: false });

  // 3) Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}'.\nIf you didn't forgot your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to the email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3) Update the changedPasswordAt property for the user
  // 4) Log the user in, send JWT to the client
  createSendToken(user, 200, res);
});

// Now remember that this password updating functionality
// is only for logged-in users but still we need the user
// to pass in his current password. so in order to confirm
// that user actually is who he says he is.

// Someone would be able to get access to your computer
// and change the password without you knowing it.
// So as a security measure we always need to ask for the
// current password before updating it.

exports.updateCurrentUserPassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from collection
  const user = await User.findById(req.user._id).select('+password');
  // 2) Check if posted current password is correct
  const isPasswordCorrect = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!isPasswordCorrect) {
    return next(new AppError('Please enter your password correctly', 400));
  }
  // 3) If the password is correct then update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // 4) Log user in, send JWT

  createSendToken(user, 200, res);
});
