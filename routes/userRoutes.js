const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

router
  .route('/updateCurrentUserPassword')
  .patch(authController.protect, authController.updateCurrentUserPassword);

router
  .route('/updateCurrentUser')
  .patch(authController.protect, userController.updateCurrentUser);

router
  .route('/deleteCurrentUser')
  .delete(authController.protect, userController.deleteCurrentUser);

router.route('/').get(userController.getAllUsers);

module.exports = router;
