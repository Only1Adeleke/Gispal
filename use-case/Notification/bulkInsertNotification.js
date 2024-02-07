
/**
 *bulkInsertNotification.js
 */

const  NotificationEntity = require('../../entities/Notification');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created Notifications. {status, message, data}
 */
const bulkInsertNotification = ({
  NotificationDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let notificationEntities = dataToCreate.map(item => NotificationEntity(item));
  let createdNotification = await NotificationDb.createMany(notificationEntities);
  return response.success({ data:{ count: createdNotification.length } });
};
module.exports = bulkInsertNotification;