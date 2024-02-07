/**
 *updateProcessedFile.js
 */

const  ProcessedFileEntity = require('../../entities/ProcessedFile');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated ProcessedFile. {status, message, data}
 */
const updateProcessedFile = ({
  ProcessedFileDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedProcessedFile = ProcessedFileEntity(dataToUpdate);
  updatedProcessedFile = await ProcessedFileDb.update(query,updatedProcessedFile);
  if (!updatedProcessedFile || updatedProcessedFile.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedProcessedFile[0] });
};
module.exports = updateProcessedFile;