const express = require('express');
const router = express.Router();
const NotificationController = require('../../../controller/client/v1/Notification');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/notification/create').post(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.addNotification);
router.route('/client/api/v1/notification/list').post(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.findAllNotification);

router.route('/client/api/v1/notification/count').post(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.getNotificationCount);
router.route('/client/api/v1/notification/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.getNotificationById);

router.route('/client/api/v1/notification/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.updateNotification);   
router.route('/client/api/v1/notification/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.partialUpdateNotification);   

router.route('/client/api/v1/notification/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.softDeleteNotification);
router.route('/client/api/v1/notification/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.softDeleteManyNotification);
router.route('/client/api/v1/notification/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.bulkInsertNotification);

router.route('/client/api/v1/notification/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.bulkUpdateNotification); 
router.route('/client/api/v1/notification/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.deleteNotification);
router.route('/client/api/v1/notification/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,NotificationController.deleteManyNotification);

module.exports = router;
