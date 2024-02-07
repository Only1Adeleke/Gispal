
/**
 *addExternalStoragePreference.js
 */

const  ExternalStoragePreferenceEntity = require('../../entities/ExternalStoragePreference');
const response = require('../../utils/response');

/**
 * @description : create new record of ExternalStoragePreference in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addExternalStoragePreference = ({
  ExternalStoragePreferenceDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdExternalStoragePreference  = ExternalStoragePreferenceEntity(dataToCreate);
  createdExternalStoragePreference = await ExternalStoragePreferenceDb.createOne(createdExternalStoragePreference );
  return response.success({ data:createdExternalStoragePreference });
};
module.exports = addExternalStoragePreference;