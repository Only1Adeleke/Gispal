const response = require('../../utils/response');

/**
 * @description : removing PlayerIDs to send push notification
 * @param {Object} params : request body.
 * @return {Object} : response for removePlayerId {status, message, data}
 */
const removePlayerId = ({ pushNotificationDb })=> async (params) => {
  if (!params.deviceId){
    return response.badRequest({ message : 'Insufficient request parameters! deviceId is required.' });
  }
  await pushNotificationDb.destroy({ deviceId:params.deviceId });
  return response.success({ message :'PlayerId removed.' });
};
module.exports = removePlayerId;