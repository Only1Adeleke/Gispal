/**
 *partialUpdateNotification.js
 */

const  NotificationEntity = require('../../entities/Notification');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated Notification. {status, message, data}
 */
const partialUpdateNotification = ({ NotificationDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedNotification = await NotificationDb.update(query,dataToUpdate);
  if (!updatedNotification || updatedNotification.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedNotification[0] });
};
module.exports = partialUpdateNotification;