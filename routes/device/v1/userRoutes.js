const express = require('express');
const router = express.Router();
const userController = require('../../../controller/device/v1/user');
const { auth, } = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/user/me').get(auth(PLATFORM.DEVICE),userController.getLoggedInUserInfo);

router.route('/device/api/v1/user/change-password').put(auth(PLATFORM.DEVICE),userController.changePassword);
router.route('/device/api/v1/user/update-profile').put(auth(PLATFORM.DEVICE),userController.updateProfile);

module.exports = router;
