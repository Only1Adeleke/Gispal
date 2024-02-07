
/**
 *addProcessedFile.js
 */

const  ProcessedFileEntity = require('../../entities/ProcessedFile');
const response = require('../../utils/response');

/**
 * @description : create new record of ProcessedFile in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addProcessedFile = ({
  ProcessedFileDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdProcessedFile  = ProcessedFileEntity(dataToCreate);
  createdProcessedFile = await ProcessedFileDb.createOne(createdProcessedFile );
  return response.success({ data:createdProcessedFile });
};
module.exports = addProcessedFile;