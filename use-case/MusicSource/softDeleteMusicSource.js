/**
 *softDeleteMusicSource.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated MusicSource. {status, message, data}
 */
const softDeleteMusicSource = ({ MusicSourceDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedMusicSource = await MusicSourceDb.update(query, dataToUpdate);
  if (!updatedMusicSource || updatedMusicSource.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedMusicSource[0] });
};
module.exports = softDeleteMusicSource;
