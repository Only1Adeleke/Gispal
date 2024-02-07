
/**
 *bulkInsertAnnouncement.js
 */

const  AnnouncementEntity = require('../../entities/Announcement');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created Announcements. {status, message, data}
 */
const bulkInsertAnnouncement = ({
  AnnouncementDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let announcementEntities = dataToCreate.map(item => AnnouncementEntity(item));
  let createdAnnouncement = await AnnouncementDb.createMany(announcementEntities);
  return response.success({ data:{ count: createdAnnouncement.length } });
};
module.exports = bulkInsertAnnouncement;