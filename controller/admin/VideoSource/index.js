const VideoSourceDb = require('../../../data-access/VideoSourceDb');
const VideoSourceSchema = require('../../../validation/schema/VideoSource');
const createValidation = require('../../../validation')(VideoSourceSchema.createSchema);
const updateValidation = require('../../../validation')(VideoSourceSchema.updateSchema);
const filterValidation = require('../../../validation')(VideoSourceSchema.filterValidationSchema);
const VideoSourceController = require('./VideoSource');

// use-cases imports with dependency injection
const addVideoSourceUsecase = require('../../../use-case/VideoSource/addVideoSource')({
  VideoSourceDb,
  createValidation 
});
const findAllVideoSourceUsecase = require('../../../use-case/VideoSource/findAllVideoSource')({
  VideoSourceDb,
  filterValidation
});
const getVideoSourceCountUsecase = require('../../../use-case/VideoSource/getVideoSourceCount')({
  VideoSourceDb,
  filterValidation
});
const getVideoSourceUsecase = require('../../../use-case/VideoSource/getVideoSource')({
  VideoSourceDb,
  filterValidation
});
const updateVideoSourceUsecase = require('../../../use-case/VideoSource/updateVideoSource')({
  VideoSourceDb,
  updateValidation 
});
const partialUpdateVideoSourceUsecase = require('../../../use-case/VideoSource/partialUpdateVideoSource')({
  VideoSourceDb,
  updateValidation
});
const softDeleteVideoSourceUsecase = require('../../../use-case/VideoSource/softDeleteVideoSource')({ VideoSourceDb });
const softDeleteManyVideoSourceUsecase = require('../../../use-case/VideoSource/softDeleteManyVideoSource')({ VideoSourceDb });
const bulkInsertVideoSourceUsecase = require('../../../use-case/VideoSource/bulkInsertVideoSource')({ VideoSourceDb });
const bulkUpdateVideoSourceUsecase = require('../../../use-case/VideoSource/bulkUpdateVideoSource')({ VideoSourceDb });
const deleteVideoSourceUsecase = require('../../../use-case/VideoSource/deleteVideoSource')({ VideoSourceDb });
const deleteManyVideoSourceUsecase = require('../../../use-case/VideoSource/deleteManyVideoSource')({ VideoSourceDb });

// controller methods mapping
const addVideoSource = VideoSourceController.addVideoSource(addVideoSourceUsecase);
const findAllVideoSource = VideoSourceController.findAllVideoSource(findAllVideoSourceUsecase);
const getVideoSourceCount = VideoSourceController.getVideoSourceCount(getVideoSourceCountUsecase);
const getVideoSourceById = VideoSourceController.getVideoSource(getVideoSourceUsecase);
const updateVideoSource = VideoSourceController.updateVideoSource(updateVideoSourceUsecase);
const partialUpdateVideoSource = VideoSourceController.partialUpdateVideoSource(partialUpdateVideoSourceUsecase);
const softDeleteVideoSource = VideoSourceController.softDeleteVideoSource(softDeleteVideoSourceUsecase);
const softDeleteManyVideoSource = VideoSourceController.softDeleteManyVideoSource(softDeleteManyVideoSourceUsecase);
const bulkInsertVideoSource = VideoSourceController.bulkInsertVideoSource(bulkInsertVideoSourceUsecase);
const bulkUpdateVideoSource = VideoSourceController.bulkUpdateVideoSource(bulkUpdateVideoSourceUsecase);
const deleteVideoSource = VideoSourceController.deleteVideoSource(deleteVideoSourceUsecase);
const deleteManyVideoSource = VideoSourceController.deleteManyVideoSource(deleteManyVideoSourceUsecase);

module.exports = {
  addVideoSource,
  findAllVideoSource,
  getVideoSourceCount,
  getVideoSourceById,
  updateVideoSource,
  partialUpdateVideoSource,
  softDeleteVideoSource,
  softDeleteManyVideoSource,
  bulkInsertVideoSource,
  bulkUpdateVideoSource,
  deleteVideoSource,
  deleteManyVideoSource,
};