const NotificationDb = require('../../../data-access/NotificationDb');
const NotificationSchema = require('../../../validation/schema/Notification');
const createValidation = require('../../../validation')(NotificationSchema.createSchema);
const updateValidation = require('../../../validation')(NotificationSchema.updateSchema);
const filterValidation = require('../../../validation')(NotificationSchema.filterValidationSchema);
const NotificationController = require('./Notification');

// use-cases imports with dependency injection
const addNotificationUsecase = require('../../../use-case/Notification/addNotification')({
  NotificationDb,
  createValidation 
});
const findAllNotificationUsecase = require('../../../use-case/Notification/findAllNotification')({
  NotificationDb,
  filterValidation
});
const getNotificationCountUsecase = require('../../../use-case/Notification/getNotificationCount')({
  NotificationDb,
  filterValidation
});
const getNotificationUsecase = require('../../../use-case/Notification/getNotification')({
  NotificationDb,
  filterValidation
});
const updateNotificationUsecase = require('../../../use-case/Notification/updateNotification')({
  NotificationDb,
  updateValidation 
});
const partialUpdateNotificationUsecase = require('../../../use-case/Notification/partialUpdateNotification')({
  NotificationDb,
  updateValidation
});
const softDeleteNotificationUsecase = require('../../../use-case/Notification/softDeleteNotification')({ NotificationDb });
const softDeleteManyNotificationUsecase = require('../../../use-case/Notification/softDeleteManyNotification')({ NotificationDb });
const bulkInsertNotificationUsecase = require('../../../use-case/Notification/bulkInsertNotification')({ NotificationDb });
const bulkUpdateNotificationUsecase = require('../../../use-case/Notification/bulkUpdateNotification')({ NotificationDb });
const deleteNotificationUsecase = require('../../../use-case/Notification/deleteNotification')({ NotificationDb });
const deleteManyNotificationUsecase = require('../../../use-case/Notification/deleteManyNotification')({ NotificationDb });

// controller methods mapping
const addNotification = NotificationController.addNotification(addNotificationUsecase);
const findAllNotification = NotificationController.findAllNotification(findAllNotificationUsecase);
const getNotificationCount = NotificationController.getNotificationCount(getNotificationCountUsecase);
const getNotificationById = NotificationController.getNotification(getNotificationUsecase);
const updateNotification = NotificationController.updateNotification(updateNotificationUsecase);
const partialUpdateNotification = NotificationController.partialUpdateNotification(partialUpdateNotificationUsecase);
const softDeleteNotification = NotificationController.softDeleteNotification(softDeleteNotificationUsecase);
const softDeleteManyNotification = NotificationController.softDeleteManyNotification(softDeleteManyNotificationUsecase);
const bulkInsertNotification = NotificationController.bulkInsertNotification(bulkInsertNotificationUsecase);
const bulkUpdateNotification = NotificationController.bulkUpdateNotification(bulkUpdateNotificationUsecase);
const deleteNotification = NotificationController.deleteNotification(deleteNotificationUsecase);
const deleteManyNotification = NotificationController.deleteManyNotification(deleteManyNotificationUsecase);

module.exports = {
  addNotification,
  findAllNotification,
  getNotificationCount,
  getNotificationById,
  updateNotification,
  partialUpdateNotification,
  softDeleteNotification,
  softDeleteManyNotification,
  bulkInsertNotification,
  bulkUpdateNotification,
  deleteNotification,
  deleteManyNotification,
};