const express = require('express');
const router = express.Router();
const fileUploadController = require('../../../controller/client/v1/fileUpload');
const responseHandler = require('../../../utils/response/responseHandler');

router.route('/client/api/v1/upload').post(fileUploadController.upload);

module.exports = router;