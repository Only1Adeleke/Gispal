const express = require('express');
const router = express.Router();
const ProcessedFileController = require('../../../controller/client/v1/ProcessedFile');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/processedfile/create').post(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.addProcessedFile);
router.route('/client/api/v1/processedfile/list').post(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.findAllProcessedFile);

router.route('/client/api/v1/processedfile/count').post(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.getProcessedFileCount);
router.route('/client/api/v1/processedfile/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.getProcessedFileById);

router.route('/client/api/v1/processedfile/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.updateProcessedFile);   
router.route('/client/api/v1/processedfile/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.partialUpdateProcessedFile);   

router.route('/client/api/v1/processedfile/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.softDeleteProcessedFile);
router.route('/client/api/v1/processedfile/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.softDeleteManyProcessedFile);
router.route('/client/api/v1/processedfile/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.bulkInsertProcessedFile);

router.route('/client/api/v1/processedfile/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.bulkUpdateProcessedFile); 
router.route('/client/api/v1/processedfile/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.deleteProcessedFile);
router.route('/client/api/v1/processedfile/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,ProcessedFileController.deleteManyProcessedFile);

module.exports = router;
