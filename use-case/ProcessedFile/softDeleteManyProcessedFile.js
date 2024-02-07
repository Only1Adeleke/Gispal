/**
 *softDeleteManyProcessedFile.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete multiple records from database by ids;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : number of deactivated documents. {status, message, data}
 */
const softDeleteManyProcessedFile = ({ ProcessedFileDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  let updatedProcessedFile = (await ProcessedFileDb.update(query, dataToUpdate)).length;
  return response.success({ data:{ count:updatedProcessedFile } });
};
module.exports = softDeleteManyProcessedFile;
