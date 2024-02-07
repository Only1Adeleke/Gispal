
/**
 *deleteMusicSource.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted MusicSource. {status, message, data}
 */
const deleteMusicSource = ({ MusicSourceDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedMusicSource = await MusicSourceDb.destroy(query);
  if (!deletedMusicSource || deletedMusicSource.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedMusicSource[0] });
};

module.exports = deleteMusicSource;
