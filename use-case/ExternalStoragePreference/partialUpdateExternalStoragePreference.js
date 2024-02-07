/**
 *partialUpdateExternalStoragePreference.js
 */

const  ExternalStoragePreferenceEntity = require('../../entities/ExternalStoragePreference');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated ExternalStoragePreference. {status, message, data}
 */
const partialUpdateExternalStoragePreference = ({ ExternalStoragePreferenceDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedExternalStoragePreference = await ExternalStoragePreferenceDb.update(query,dataToUpdate);
  if (!updatedExternalStoragePreference || updatedExternalStoragePreference.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedExternalStoragePreference[0] });
};
module.exports = partialUpdateExternalStoragePreference;