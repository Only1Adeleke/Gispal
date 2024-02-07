let  userDb = require('../../../data-access/userDb');
const userTokensDb = require('../../../data-access/userTokensDb');
const userSchema = require('../../../validation/schema/user');
const createValidation = require('../../../validation')(userSchema.createSchema);
const updateValidation = require('../../../validation')(userSchema.updateSchema);
const userRoleDb  = require('../../../data-access/userRoleDb');
const routeRoleDb  = require('../../../data-access/routeRoleDb');
const roleDb = require('../../../data-access/roleDb');
const userAuthSettingsDb = require('../../../data-access/userAuthSettingsDb');    
const authController = require('./authController');

// use-cases imports with dependency injection
const registerUsecase = require('../../../use-case/authentication/register')({ 
  userDb, 
  createValidation, 
});
const forgotPasswordUsecase = require('../../../use-case/authentication/forgotPassword')({
  userDb,
  userAuthSettingsDb
});
const resetPasswordUsecase = require('../../../use-case/authentication/resetPassword')({
  userDb,
  userAuthSettingsDb
});
const validateResetPasswordOtpUsecase = require('../../../use-case/authentication/validateResetPasswordOtp')({ userAuthSettingsDb });
const logoutUsecase = require('../../../use-case/authentication/logout')({ userTokensDb });
const authenticationUsecase = require('../../../use-case/authentication/authentication')({
  userDb,
  userTokensDb,
  userAuthSettingsDb
});
const addPlayerIdUsecase = require('../../../use-case/authentication/addPlayerId')({ userDb });
const removePlayerIdUsecase = require('../../../use-case/authentication/removePlayerId')({ userDb });

const register = authController.register(registerUsecase);
const forgotPassword = authController.forgotPassword(forgotPasswordUsecase);
const resetPassword = authController.resetPassword(resetPasswordUsecase);
const validateResetPasswordOtp = authController.validateResetPasswordOtp(validateResetPasswordOtpUsecase);
const logout = authController.logout(logoutUsecase);
const authentication = authController.authentication(authenticationUsecase);
const addPlayerId = authController.addPlayerId(addPlayerIdUsecase);
const removePlayerId = authController.removePlayerId(removePlayerIdUsecase);

module.exports = {
  register,
  forgotPassword,
  resetPassword,
  validateResetPasswordOtp,
  logout,
  authentication,
  addPlayerId,
  removePlayerId    
};
