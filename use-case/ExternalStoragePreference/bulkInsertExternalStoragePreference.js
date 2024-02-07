
/**
 *bulkInsertExternalStoragePreference.js
 */

const  ExternalStoragePreferenceEntity = require('../../entities/ExternalStoragePreference');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created ExternalStoragePreferences. {status, message, data}
 */
const bulkInsertExternalStoragePreference = ({
  ExternalStoragePreferenceDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let externalstoragepreferenceEntities = dataToCreate.map(item => ExternalStoragePreferenceEntity(item));
  let createdExternalStoragePreference = await ExternalStoragePreferenceDb.createMany(externalstoragepreferenceEntities);
  return response.success({ data:{ count: createdExternalStoragePreference.length } });
};
module.exports = bulkInsertExternalStoragePreference;