/**
 *updateAnnouncement.js
 */

const  AnnouncementEntity = require('../../entities/Announcement');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated Announcement. {status, message, data}
 */
const updateAnnouncement = ({
  AnnouncementDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedAnnouncement = AnnouncementEntity(dataToUpdate);
  updatedAnnouncement = await AnnouncementDb.update(query,updatedAnnouncement);
  if (!updatedAnnouncement || updatedAnnouncement.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedAnnouncement[0] });
};
module.exports = updateAnnouncement;