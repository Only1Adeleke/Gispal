/**
 *updateExternalStoragePreference.js
 */

const  ExternalStoragePreferenceEntity = require('../../entities/ExternalStoragePreference');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated ExternalStoragePreference. {status, message, data}
 */
const updateExternalStoragePreference = ({
  ExternalStoragePreferenceDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedExternalStoragePreference = ExternalStoragePreferenceEntity(dataToUpdate);
  updatedExternalStoragePreference = await ExternalStoragePreferenceDb.update(query,updatedExternalStoragePreference);
  if (!updatedExternalStoragePreference || updatedExternalStoragePreference.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedExternalStoragePreference[0] });
};
module.exports = updateExternalStoragePreference;