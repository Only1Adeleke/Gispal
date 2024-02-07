const express = require('express');
const router = express.Router();
const VideoSourceController = require('../../../controller/client/v1/VideoSource');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/videosource/create').post(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.addVideoSource);
router.route('/client/api/v1/videosource/list').post(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.findAllVideoSource);

router.route('/client/api/v1/videosource/count').post(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.getVideoSourceCount);
router.route('/client/api/v1/videosource/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.getVideoSourceById);

router.route('/client/api/v1/videosource/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.updateVideoSource);   
router.route('/client/api/v1/videosource/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.partialUpdateVideoSource);   

router.route('/client/api/v1/videosource/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.softDeleteVideoSource);
router.route('/client/api/v1/videosource/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.softDeleteManyVideoSource);
router.route('/client/api/v1/videosource/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.bulkInsertVideoSource);

router.route('/client/api/v1/videosource/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.bulkUpdateVideoSource); 
router.route('/client/api/v1/videosource/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.deleteVideoSource);
router.route('/client/api/v1/videosource/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,VideoSourceController.deleteManyVideoSource);

module.exports = router;
