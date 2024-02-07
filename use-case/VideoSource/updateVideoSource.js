/**
 *updateVideoSource.js
 */

const  VideoSourceEntity = require('../../entities/VideoSource');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated VideoSource. {status, message, data}
 */
const updateVideoSource = ({
  VideoSourceDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedVideoSource = VideoSourceEntity(dataToUpdate);
  updatedVideoSource = await VideoSourceDb.update(query,updatedVideoSource);
  if (!updatedVideoSource || updatedVideoSource.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedVideoSource[0] });
};
module.exports = updateVideoSource;