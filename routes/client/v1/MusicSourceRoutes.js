const express = require('express');
const router = express.Router();
const MusicSourceController = require('../../../controller/client/v1/MusicSource');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/musicsource/create').post(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.addMusicSource);
router.route('/client/api/v1/musicsource/list').post(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.findAllMusicSource);

router.route('/client/api/v1/musicsource/count').post(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.getMusicSourceCount);
router.route('/client/api/v1/musicsource/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.getMusicSourceById);

router.route('/client/api/v1/musicsource/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.updateMusicSource);   
router.route('/client/api/v1/musicsource/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.partialUpdateMusicSource);   

router.route('/client/api/v1/musicsource/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.softDeleteMusicSource);
router.route('/client/api/v1/musicsource/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.softDeleteManyMusicSource);
router.route('/client/api/v1/musicsource/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.bulkInsertMusicSource);

router.route('/client/api/v1/musicsource/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.bulkUpdateMusicSource); 
router.route('/client/api/v1/musicsource/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.deleteMusicSource);
router.route('/client/api/v1/musicsource/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,MusicSourceController.deleteManyMusicSource);

module.exports = router;
