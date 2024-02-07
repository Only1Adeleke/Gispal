/**
 *softDeleteVideoSource.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated VideoSource. {status, message, data}
 */
const softDeleteVideoSource = ({ VideoSourceDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedVideoSource = await VideoSourceDb.update(query, dataToUpdate);
  if (!updatedVideoSource || updatedVideoSource.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedVideoSource[0] });
};
module.exports = softDeleteVideoSource;
