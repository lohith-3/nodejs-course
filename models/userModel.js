const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: [8, 'Password must have more or equal then 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        // This is only gonna work on save/create not on update
        return val === this.password; // abc === abc (true)
      },
      message: `Passwords are not the same`,
    },
  },
  passwordChangedAt: {
    type: Date,
  },
});

// Document Middleware: runs before .save() and .create()

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // delete the passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

// So an instance method is basically a method that is
// gonna be available on all documents of a certain collection.

// In an instance method, the this keyword always points to
// the current document

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // 100 < 200 (TRUE) // 300 < 200 (FALSE)
    return JWTTimeStamp < changedTimeStamp;
  }

  // False means not changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// How Authentication with JWT works

// npm i jsonwebtoken
