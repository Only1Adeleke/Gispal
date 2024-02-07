const express = require('express');
const router = express.Router();
const NotificationController = require('../../../controller/device/v1/Notification');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/notification/create').post(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.addNotification);
router.route('/device/api/v1/notification/list').post(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.findAllNotification);

router.route('/device/api/v1/notification/count').post(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.getNotificationCount);
router.route('/device/api/v1/notification/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.getNotificationById);

router.route('/device/api/v1/notification/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.updateNotification);   
router.route('/device/api/v1/notification/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.partialUpdateNotification);   

router.route('/device/api/v1/notification/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.softDeleteNotification);
router.route('/device/api/v1/notification/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.softDeleteManyNotification);
router.route('/device/api/v1/notification/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.bulkInsertNotification);

router.route('/device/api/v1/notification/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.bulkUpdateNotification); 
router.route('/device/api/v1/notification/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.deleteNotification);
router.route('/device/api/v1/notification/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,NotificationController.deleteManyNotification);

module.exports = router;
