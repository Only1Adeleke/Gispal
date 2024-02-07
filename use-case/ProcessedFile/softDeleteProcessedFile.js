/**
 *softDeleteProcessedFile.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated ProcessedFile. {status, message, data}
 */
const softDeleteProcessedFile = ({ ProcessedFileDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedProcessedFile = await ProcessedFileDb.update(query, dataToUpdate);
  if (!updatedProcessedFile || updatedProcessedFile.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedProcessedFile[0] });
};
module.exports = softDeleteProcessedFile;
