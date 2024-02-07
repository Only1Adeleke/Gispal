const express = require('express');
const router = express.Router();
const fileUploadController = require('../../controller/admin/fileUpload');
const responseHandler = require('../../utils/response/responseHandler');

router.route('/admin/upload').post(fileUploadController.upload);

module.exports = router;