const express = require('express');
const router = express.Router();
const MusicSourceController = require('../../../controller/device/v1/MusicSource');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/musicsource/create').post(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.addMusicSource);
router.route('/device/api/v1/musicsource/list').post(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.findAllMusicSource);

router.route('/device/api/v1/musicsource/count').post(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.getMusicSourceCount);
router.route('/device/api/v1/musicsource/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.getMusicSourceById);

router.route('/device/api/v1/musicsource/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.updateMusicSource);   
router.route('/device/api/v1/musicsource/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.partialUpdateMusicSource);   

router.route('/device/api/v1/musicsource/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.softDeleteMusicSource);
router.route('/device/api/v1/musicsource/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.softDeleteManyMusicSource);
router.route('/device/api/v1/musicsource/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.bulkInsertMusicSource);

router.route('/device/api/v1/musicsource/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.bulkUpdateMusicSource); 
router.route('/device/api/v1/musicsource/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.deleteMusicSource);
router.route('/device/api/v1/musicsource/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,MusicSourceController.deleteManyMusicSource);

module.exports = router;
