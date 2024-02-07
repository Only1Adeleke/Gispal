
/**
 *addNotification.js
 */

const  NotificationEntity = require('../../entities/Notification');
const response = require('../../utils/response');

/**
 * @description : create new record of Notification in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addNotification = ({
  NotificationDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdNotification  = NotificationEntity(dataToCreate);
  createdNotification = await NotificationDb.createOne(createdNotification );
  return response.success({ data:createdNotification });
};
module.exports = addNotification;