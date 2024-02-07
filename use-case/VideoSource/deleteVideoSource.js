
/**
 *deleteVideoSource.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted VideoSource. {status, message, data}
 */
const deleteVideoSource = ({ VideoSourceDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedVideoSource = await VideoSourceDb.destroy(query);
  if (!deletedVideoSource || deletedVideoSource.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedVideoSource[0] });
};

module.exports = deleteVideoSource;
