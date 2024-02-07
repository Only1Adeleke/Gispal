const express = require('express');
const router = express.Router();
const ProcessedFileController = require('../../controller/admin/ProcessedFile');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/processedfile/create').post(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.addProcessedFile);
router.route('/admin/processedfile/list').post(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.findAllProcessedFile);

router.route('/admin/processedfile/count').post(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.getProcessedFileCount);
router.route('/admin/processedfile/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.getProcessedFileById);

router.route('/admin/processedfile/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.updateProcessedFile);   
router.route('/admin/processedfile/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.partialUpdateProcessedFile);   

router.route('/admin/processedfile/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.softDeleteProcessedFile);
router.route('/admin/processedfile/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.softDeleteManyProcessedFile);
router.route('/admin/processedfile/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.bulkInsertProcessedFile);

router.route('/admin/processedfile/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.bulkUpdateProcessedFile); 
router.route('/admin/processedfile/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.deleteProcessedFile);
router.route('/admin/processedfile/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,ProcessedFileController.deleteManyProcessedFile);

module.exports = router;
