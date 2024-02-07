/**
 *updateMusicSource.js
 */

const  MusicSourceEntity = require('../../entities/MusicSource');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated MusicSource. {status, message, data}
 */
const updateMusicSource = ({
  MusicSourceDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedMusicSource = MusicSourceEntity(dataToUpdate);
  updatedMusicSource = await MusicSourceDb.update(query,updatedMusicSource);
  if (!updatedMusicSource || updatedMusicSource.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedMusicSource[0] });
};
module.exports = updateMusicSource;