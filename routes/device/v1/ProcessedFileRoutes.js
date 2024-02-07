const express = require('express');
const router = express.Router();
const ProcessedFileController = require('../../../controller/device/v1/ProcessedFile');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/processedfile/create').post(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.addProcessedFile);
router.route('/device/api/v1/processedfile/list').post(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.findAllProcessedFile);

router.route('/device/api/v1/processedfile/count').post(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.getProcessedFileCount);
router.route('/device/api/v1/processedfile/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.getProcessedFileById);

router.route('/device/api/v1/processedfile/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.updateProcessedFile);   
router.route('/device/api/v1/processedfile/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.partialUpdateProcessedFile);   

router.route('/device/api/v1/processedfile/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.softDeleteProcessedFile);
router.route('/device/api/v1/processedfile/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.softDeleteManyProcessedFile);
router.route('/device/api/v1/processedfile/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.bulkInsertProcessedFile);

router.route('/device/api/v1/processedfile/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.bulkUpdateProcessedFile); 
router.route('/device/api/v1/processedfile/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.deleteProcessedFile);
router.route('/device/api/v1/processedfile/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,ProcessedFileController.deleteManyProcessedFile);

module.exports = router;
