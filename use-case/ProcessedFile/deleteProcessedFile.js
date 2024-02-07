
/**
 *deleteProcessedFile.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted ProcessedFile. {status, message, data}
 */
const deleteProcessedFile = ({ ProcessedFileDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedProcessedFile = await ProcessedFileDb.destroy(query);
  if (!deletedProcessedFile || deletedProcessedFile.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedProcessedFile[0] });
};

module.exports = deleteProcessedFile;
