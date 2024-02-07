const express = require('express');
const router = express.Router();
const AnnouncementController = require('../../controller/admin/Announcement');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/announcement/create').post(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.addAnnouncement);
router.route('/admin/announcement/list').post(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.findAllAnnouncement);

router.route('/admin/announcement/count').post(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.getAnnouncementCount);
router.route('/admin/announcement/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.getAnnouncementById);

router.route('/admin/announcement/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.updateAnnouncement);   
router.route('/admin/announcement/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.partialUpdateAnnouncement);   

router.route('/admin/announcement/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.softDeleteAnnouncement);
router.route('/admin/announcement/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.softDeleteManyAnnouncement);
router.route('/admin/announcement/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.bulkInsertAnnouncement);

router.route('/admin/announcement/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.bulkUpdateAnnouncement); 
router.route('/admin/announcement/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.deleteAnnouncement);
router.route('/admin/announcement/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,AnnouncementController.deleteManyAnnouncement);

module.exports = router;
