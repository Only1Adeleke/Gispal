
/**
 *bulkInsertProcessedFile.js
 */

const  ProcessedFileEntity = require('../../entities/ProcessedFile');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created ProcessedFiles. {status, message, data}
 */
const bulkInsertProcessedFile = ({
  ProcessedFileDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let processedfileEntities = dataToCreate.map(item => ProcessedFileEntity(item));
  let createdProcessedFile = await ProcessedFileDb.createMany(processedfileEntities);
  return response.success({ data:{ count: createdProcessedFile.length } });
};
module.exports = bulkInsertProcessedFile;