/**
 *partialUpdateMusicSource.js
 */

const  MusicSourceEntity = require('../../entities/MusicSource');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated MusicSource. {status, message, data}
 */
const partialUpdateMusicSource = ({ MusicSourceDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedMusicSource = await MusicSourceDb.update(query,dataToUpdate);
  if (!updatedMusicSource || updatedMusicSource.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedMusicSource[0] });
};
module.exports = partialUpdateMusicSource;