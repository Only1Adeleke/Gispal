/**
 *updateNotification.js
 */

const  NotificationEntity = require('../../entities/Notification');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated Notification. {status, message, data}
 */
const updateNotification = ({
  NotificationDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedNotification = NotificationEntity(dataToUpdate);
  updatedNotification = await NotificationDb.update(query,updatedNotification);
  if (!updatedNotification || updatedNotification.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedNotification[0] });
};
module.exports = updateNotification;