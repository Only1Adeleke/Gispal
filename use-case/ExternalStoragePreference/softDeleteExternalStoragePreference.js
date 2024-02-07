/**
 *softDeleteExternalStoragePreference.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated ExternalStoragePreference. {status, message, data}
 */
const softDeleteExternalStoragePreference = ({ ExternalStoragePreferenceDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedExternalStoragePreference = await ExternalStoragePreferenceDb.update(query, dataToUpdate);
  if (!updatedExternalStoragePreference || updatedExternalStoragePreference.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedExternalStoragePreference[0] });
};
module.exports = softDeleteExternalStoragePreference;
