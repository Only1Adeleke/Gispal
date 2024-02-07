
/**
 *deleteExternalStoragePreference.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted ExternalStoragePreference. {status, message, data}
 */
const deleteExternalStoragePreference = ({ ExternalStoragePreferenceDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedExternalStoragePreference = await ExternalStoragePreferenceDb.destroy(query);
  if (!deletedExternalStoragePreference || deletedExternalStoragePreference.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedExternalStoragePreference[0] });
};

module.exports = deleteExternalStoragePreference;
