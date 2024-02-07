const express = require('express');
const router = express.Router();
const AnnouncementController = require('../../../controller/device/v1/Announcement');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/announcement/create').post(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.addAnnouncement);
router.route('/device/api/v1/announcement/list').post(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.findAllAnnouncement);

router.route('/device/api/v1/announcement/count').post(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.getAnnouncementCount);
router.route('/device/api/v1/announcement/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.getAnnouncementById);

router.route('/device/api/v1/announcement/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.updateAnnouncement);   
router.route('/device/api/v1/announcement/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.partialUpdateAnnouncement);   

router.route('/device/api/v1/announcement/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.softDeleteAnnouncement);
router.route('/device/api/v1/announcement/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.softDeleteManyAnnouncement);
router.route('/device/api/v1/announcement/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.bulkInsertAnnouncement);

router.route('/device/api/v1/announcement/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.bulkUpdateAnnouncement); 
router.route('/device/api/v1/announcement/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.deleteAnnouncement);
router.route('/device/api/v1/announcement/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,AnnouncementController.deleteManyAnnouncement);

module.exports = router;
