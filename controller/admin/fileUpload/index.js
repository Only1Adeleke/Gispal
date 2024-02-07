const fileUploadUsecase = require('../../../use-case/fileUpload/upload');

const fileUploadController = require('./fileUploadController');

const upload = fileUploadController.upload(fileUploadUsecase);

module.exports = { upload };