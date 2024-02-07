/**
 *partialUpdateAnnouncement.js
 */

const  AnnouncementEntity = require('../../entities/Announcement');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated Announcement. {status, message, data}
 */
const partialUpdateAnnouncement = ({ AnnouncementDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedAnnouncement = await AnnouncementDb.update(query,dataToUpdate);
  if (!updatedAnnouncement || updatedAnnouncement.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedAnnouncement[0] });
};
module.exports = partialUpdateAnnouncement;