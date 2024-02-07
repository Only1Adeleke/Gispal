const express = require('express');
const router = express.Router();
const VideoSourceController = require('../../controller/admin/VideoSource');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/videosource/create').post(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.addVideoSource);
router.route('/admin/videosource/list').post(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.findAllVideoSource);

router.route('/admin/videosource/count').post(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.getVideoSourceCount);
router.route('/admin/videosource/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.getVideoSourceById);

router.route('/admin/videosource/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.updateVideoSource);   
router.route('/admin/videosource/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.partialUpdateVideoSource);   

router.route('/admin/videosource/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.softDeleteVideoSource);
router.route('/admin/videosource/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.softDeleteManyVideoSource);
router.route('/admin/videosource/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.bulkInsertVideoSource);

router.route('/admin/videosource/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.bulkUpdateVideoSource); 
router.route('/admin/videosource/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.deleteVideoSource);
router.route('/admin/videosource/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,VideoSourceController.deleteManyVideoSource);

module.exports = router;
