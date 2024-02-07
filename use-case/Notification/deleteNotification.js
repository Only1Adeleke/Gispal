
/**
 *deleteNotification.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted Notification. {status, message, data}
 */
const deleteNotification = ({ NotificationDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedNotification = await NotificationDb.destroy(query);
  if (!deletedNotification || deletedNotification.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedNotification[0] });
};

module.exports = deleteNotification;
