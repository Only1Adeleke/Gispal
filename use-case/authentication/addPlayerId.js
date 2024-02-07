const response = require('../../utils/response');

/**
 * @description : adding PlayerIDs to send push notification
 * @param {Object} params : request body.
 * @return {Object} : response for addPlayerId {status, message, data}
 */
const addPlayerId = ({ pushNotificationDb })=> async (params) => {
  if (!params.userId || !params.playerId){
    return response.badRequest({ message : 'Insufficient request parameters! userId and playerId is required.' });
  }
  let found = await pushNotificationDb.findOne({ userId:params.userId });
  if (found){
    await pushNotificationDb.update({ id :found.id },{ playerId:params.playerId });
  } else {
    await pushNotificationDb.createOne(params);
  }
  return response.success({ message :'PlayerId added.' });
};
module.exports = addPlayerId;
