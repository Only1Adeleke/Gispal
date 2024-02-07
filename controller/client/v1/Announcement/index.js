const AnnouncementDb = require('../../../../data-access/AnnouncementDb');
const AnnouncementSchema = require('../../../../validation/schema/Announcement');
const createValidation = require('../../../../validation')(AnnouncementSchema.createSchema);
const updateValidation = require('../../../../validation')(AnnouncementSchema.updateSchema);
const filterValidation = require('../../../../validation')(AnnouncementSchema.filterValidationSchema);
const AnnouncementController = require('./Announcement');

// use-cases imports with dependency injection
const addAnnouncementUsecase = require('../../../../use-case/Announcement/addAnnouncement')({
  AnnouncementDb,
  createValidation 
});
const findAllAnnouncementUsecase = require('../../../../use-case/Announcement/findAllAnnouncement')({
  AnnouncementDb,
  filterValidation
});
const getAnnouncementCountUsecase = require('../../../../use-case/Announcement/getAnnouncementCount')({
  AnnouncementDb,
  filterValidation
});
const getAnnouncementUsecase = require('../../../../use-case/Announcement/getAnnouncement')({
  AnnouncementDb,
  filterValidation
});
const updateAnnouncementUsecase = require('../../../../use-case/Announcement/updateAnnouncement')({
  AnnouncementDb,
  updateValidation 
});
const partialUpdateAnnouncementUsecase = require('../../../../use-case/Announcement/partialUpdateAnnouncement')({
  AnnouncementDb,
  updateValidation
});
const softDeleteAnnouncementUsecase = require('../../../../use-case/Announcement/softDeleteAnnouncement')({ AnnouncementDb });
const softDeleteManyAnnouncementUsecase = require('../../../../use-case/Announcement/softDeleteManyAnnouncement')({ AnnouncementDb });
const bulkInsertAnnouncementUsecase = require('../../../../use-case/Announcement/bulkInsertAnnouncement')({ AnnouncementDb });
const bulkUpdateAnnouncementUsecase = require('../../../../use-case/Announcement/bulkUpdateAnnouncement')({ AnnouncementDb });
const deleteAnnouncementUsecase = require('../../../../use-case/Announcement/deleteAnnouncement')({ AnnouncementDb });
const deleteManyAnnouncementUsecase = require('../../../../use-case/Announcement/deleteManyAnnouncement')({ AnnouncementDb });

// controller methods mapping
const addAnnouncement = AnnouncementController.addAnnouncement(addAnnouncementUsecase);
const findAllAnnouncement = AnnouncementController.findAllAnnouncement(findAllAnnouncementUsecase);
const getAnnouncementCount = AnnouncementController.getAnnouncementCount(getAnnouncementCountUsecase);
const getAnnouncementById = AnnouncementController.getAnnouncement(getAnnouncementUsecase);
const updateAnnouncement = AnnouncementController.updateAnnouncement(updateAnnouncementUsecase);
const partialUpdateAnnouncement = AnnouncementController.partialUpdateAnnouncement(partialUpdateAnnouncementUsecase);
const softDeleteAnnouncement = AnnouncementController.softDeleteAnnouncement(softDeleteAnnouncementUsecase);
const softDeleteManyAnnouncement = AnnouncementController.softDeleteManyAnnouncement(softDeleteManyAnnouncementUsecase);
const bulkInsertAnnouncement = AnnouncementController.bulkInsertAnnouncement(bulkInsertAnnouncementUsecase);
const bulkUpdateAnnouncement = AnnouncementController.bulkUpdateAnnouncement(bulkUpdateAnnouncementUsecase);
const deleteAnnouncement = AnnouncementController.deleteAnnouncement(deleteAnnouncementUsecase);
const deleteManyAnnouncement = AnnouncementController.deleteManyAnnouncement(deleteManyAnnouncementUsecase);

module.exports = {
  addAnnouncement,
  findAllAnnouncement,
  getAnnouncementCount,
  getAnnouncementById,
  updateAnnouncement,
  partialUpdateAnnouncement,
  softDeleteAnnouncement,
  softDeleteManyAnnouncement,
  bulkInsertAnnouncement,
  bulkUpdateAnnouncement,
  deleteAnnouncement,
  deleteManyAnnouncement,
};