const express = require('express');
const router = express.Router();
const VideoSourceController = require('../../../controller/device/v1/VideoSource');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/videosource/create').post(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.addVideoSource);
router.route('/device/api/v1/videosource/list').post(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.findAllVideoSource);

router.route('/device/api/v1/videosource/count').post(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.getVideoSourceCount);
router.route('/device/api/v1/videosource/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.getVideoSourceById);

router.route('/device/api/v1/videosource/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.updateVideoSource);   
router.route('/device/api/v1/videosource/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.partialUpdateVideoSource);   

router.route('/device/api/v1/videosource/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.softDeleteVideoSource);
router.route('/device/api/v1/videosource/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.softDeleteManyVideoSource);
router.route('/device/api/v1/videosource/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.bulkInsertVideoSource);

router.route('/device/api/v1/videosource/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.bulkUpdateVideoSource); 
router.route('/device/api/v1/videosource/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.deleteVideoSource);
router.route('/device/api/v1/videosource/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,VideoSourceController.deleteManyVideoSource);

module.exports = router;
