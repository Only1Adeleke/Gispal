/**
 *partialUpdateProcessedFile.js
 */

const  ProcessedFileEntity = require('../../entities/ProcessedFile');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated ProcessedFile. {status, message, data}
 */
const partialUpdateProcessedFile = ({ ProcessedFileDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedProcessedFile = await ProcessedFileDb.update(query,dataToUpdate);
  if (!updatedProcessedFile || updatedProcessedFile.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedProcessedFile[0] });
};
module.exports = partialUpdateProcessedFile;