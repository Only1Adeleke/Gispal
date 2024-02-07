/**
 *softDeleteNotification.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated Notification. {status, message, data}
 */
const softDeleteNotification = ({ NotificationDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedNotification = await NotificationDb.update(query, dataToUpdate);
  if (!updatedNotification || updatedNotification.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedNotification[0] });
};
module.exports = softDeleteNotification;
