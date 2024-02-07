
/**
 *addVideoSource.js
 */

const  VideoSourceEntity = require('../../entities/VideoSource');
const response = require('../../utils/response');

/**
 * @description : create new record of VideoSource in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addVideoSource = ({
  VideoSourceDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdVideoSource  = VideoSourceEntity(dataToCreate);
  createdVideoSource = await VideoSourceDb.createOne(createdVideoSource );
  return response.success({ data:createdVideoSource });
};
module.exports = addVideoSource;