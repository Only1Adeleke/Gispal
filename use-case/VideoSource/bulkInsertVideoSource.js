
/**
 *bulkInsertVideoSource.js
 */

const  VideoSourceEntity = require('../../entities/VideoSource');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created VideoSources. {status, message, data}
 */
const bulkInsertVideoSource = ({
  VideoSourceDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let videosourceEntities = dataToCreate.map(item => VideoSourceEntity(item));
  let createdVideoSource = await VideoSourceDb.createMany(videosourceEntities);
  return response.success({ data:{ count: createdVideoSource.length } });
};
module.exports = bulkInsertVideoSource;