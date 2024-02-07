const userDb = require('../../../../data-access/userDb');
const PaymentTransactionDb = require('../../../../data-access/PaymentTransactionDb');
const AnnouncementDb = require('../../../../data-access/AnnouncementDb');
const ProcessedFileDb = require('../../../../data-access/ProcessedFileDb');
const userAuthSettingsDb = require('../../../../data-access/userAuthSettingsDb');
const userTokensDb = require('../../../../data-access/userTokensDb');
const userRoleDb = require('../../../../data-access/userRoleDb');
const userSchema = require('../../../../validation/schema/user');
const createValidation = require('../../../../validation')(userSchema.createSchema);
const updateValidation = require('../../../../validation')(userSchema.updateSchema);
const filterValidation = require('../../../../validation')(userSchema.filterValidationSchema);
const userController = require('./user');

// use-cases imports with dependency injection
const changePasswordUsecase = require('../../../../use-case/user/changePassword')({ userDb });
const updateProfileUsecase = require('../../../../use-case/user/updateProfile')({
  userDb,
  updateValidation
});
const getUserUsecase = require('../../../../use-case/user/getUser')({
  userDb,
  filterValidation
});

// controller methods mapping
const changePassword = userController.changePassword(changePasswordUsecase);
const updateProfile = userController.updateProfile(updateProfileUsecase);
const getLoggedInUserInfo = userController.getLoggedInUserInfo(getUserUsecase);

module.exports = {
  changePassword,
  updateProfile,
  getLoggedInUserInfo,
};