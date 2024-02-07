/**
 *softDeleteAnnouncement.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated Announcement. {status, message, data}
 */
const softDeleteAnnouncement = ({ AnnouncementDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedAnnouncement = await AnnouncementDb.update(query, dataToUpdate);
  if (!updatedAnnouncement || updatedAnnouncement.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedAnnouncement[0] });
};
module.exports = softDeleteAnnouncement;
