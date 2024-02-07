const express = require('express');
const router = express.Router();
const MusicSourceController = require('../../controller/admin/MusicSource');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/musicsource/create').post(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.addMusicSource);
router.route('/admin/musicsource/list').post(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.findAllMusicSource);

router.route('/admin/musicsource/count').post(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.getMusicSourceCount);
router.route('/admin/musicsource/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.getMusicSourceById);

router.route('/admin/musicsource/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.updateMusicSource);   
router.route('/admin/musicsource/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.partialUpdateMusicSource);   

router.route('/admin/musicsource/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.softDeleteMusicSource);
router.route('/admin/musicsource/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.softDeleteManyMusicSource);
router.route('/admin/musicsource/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.bulkInsertMusicSource);

router.route('/admin/musicsource/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.bulkUpdateMusicSource); 
router.route('/admin/musicsource/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.deleteMusicSource);
router.route('/admin/musicsource/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,MusicSourceController.deleteManyMusicSource);

module.exports = router;
