
/**
 *addMusicSource.js
 */

const  MusicSourceEntity = require('../../entities/MusicSource');
const response = require('../../utils/response');

/**
 * @description : create new record of MusicSource in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addMusicSource = ({
  MusicSourceDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdMusicSource  = MusicSourceEntity(dataToCreate);
  createdMusicSource = await MusicSourceDb.createOne(createdMusicSource );
  return response.success({ data:createdMusicSource });
};
module.exports = addMusicSource;