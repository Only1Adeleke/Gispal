
/**
 *deleteAnnouncement.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted Announcement. {status, message, data}
 */
const deleteAnnouncement = ({ AnnouncementDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedAnnouncement = await AnnouncementDb.destroy(query);
  if (!deletedAnnouncement || deletedAnnouncement.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedAnnouncement[0] });
};

module.exports = deleteAnnouncement;
