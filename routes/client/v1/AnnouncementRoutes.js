const express = require('express');
const router = express.Router();
const AnnouncementController = require('../../../controller/client/v1/Announcement');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/announcement/create').post(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.addAnnouncement);
router.route('/client/api/v1/announcement/list').post(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.findAllAnnouncement);

router.route('/client/api/v1/announcement/count').post(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.getAnnouncementCount);
router.route('/client/api/v1/announcement/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.getAnnouncementById);

router.route('/client/api/v1/announcement/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.updateAnnouncement);   
router.route('/client/api/v1/announcement/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.partialUpdateAnnouncement);   

router.route('/client/api/v1/announcement/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.softDeleteAnnouncement);
router.route('/client/api/v1/announcement/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.softDeleteManyAnnouncement);
router.route('/client/api/v1/announcement/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.bulkInsertAnnouncement);

router.route('/client/api/v1/announcement/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.bulkUpdateAnnouncement); 
router.route('/client/api/v1/announcement/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.deleteAnnouncement);
router.route('/client/api/v1/announcement/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,AnnouncementController.deleteManyAnnouncement);

module.exports = router;
