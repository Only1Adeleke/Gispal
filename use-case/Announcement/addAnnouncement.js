
/**
 *addAnnouncement.js
 */

const  AnnouncementEntity = require('../../entities/Announcement');
const response = require('../../utils/response');

/**
 * @description : create new record of Announcement in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addAnnouncement = ({
  AnnouncementDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdAnnouncement  = AnnouncementEntity(dataToCreate);
  createdAnnouncement = await AnnouncementDb.createOne(createdAnnouncement );
  return response.success({ data:createdAnnouncement });
};
module.exports = addAnnouncement;