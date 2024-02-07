
/**
 *bulkInsertMusicSource.js
 */

const  MusicSourceEntity = require('../../entities/MusicSource');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created MusicSources. {status, message, data}
 */
const bulkInsertMusicSource = ({
  MusicSourceDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let musicsourceEntities = dataToCreate.map(item => MusicSourceEntity(item));
  let createdMusicSource = await MusicSourceDb.createMany(musicsourceEntities);
  return response.success({ data:{ count: createdMusicSource.length } });
};
module.exports = bulkInsertMusicSource;