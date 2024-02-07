const express = require('express');
const router = express.Router();
const NotificationController = require('../../controller/admin/Notification');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/notification/create').post(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.addNotification);
router.route('/admin/notification/list').post(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.findAllNotification);

router.route('/admin/notification/count').post(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.getNotificationCount);
router.route('/admin/notification/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.getNotificationById);

router.route('/admin/notification/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.updateNotification);   
router.route('/admin/notification/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.partialUpdateNotification);   

router.route('/admin/notification/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.softDeleteNotification);
router.route('/admin/notification/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.softDeleteManyNotification);
router.route('/admin/notification/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.bulkInsertNotification);

router.route('/admin/notification/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.bulkUpdateNotification); 
router.route('/admin/notification/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.deleteNotification);
router.route('/admin/notification/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,NotificationController.deleteManyNotification);

module.exports = router;
