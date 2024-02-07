const MusicSourceDb = require('../../../data-access/MusicSourceDb');
const MusicSourceSchema = require('../../../validation/schema/MusicSource');
const createValidation = require('../../../validation')(MusicSourceSchema.createSchema);
const updateValidation = require('../../../validation')(MusicSourceSchema.updateSchema);
const filterValidation = require('../../../validation')(MusicSourceSchema.filterValidationSchema);
const MusicSourceController = require('./MusicSource');

// use-cases imports with dependency injection
const addMusicSourceUsecase = require('../../../use-case/MusicSource/addMusicSource')({
  MusicSourceDb,
  createValidation 
});
const findAllMusicSourceUsecase = require('../../../use-case/MusicSource/findAllMusicSource')({
  MusicSourceDb,
  filterValidation
});
const getMusicSourceCountUsecase = require('../../../use-case/MusicSource/getMusicSourceCount')({
  MusicSourceDb,
  filterValidation
});
const getMusicSourceUsecase = require('../../../use-case/MusicSource/getMusicSource')({
  MusicSourceDb,
  filterValidation
});
const updateMusicSourceUsecase = require('../../../use-case/MusicSource/updateMusicSource')({
  MusicSourceDb,
  updateValidation 
});
const partialUpdateMusicSourceUsecase = require('../../../use-case/MusicSource/partialUpdateMusicSource')({
  MusicSourceDb,
  updateValidation
});
const softDeleteMusicSourceUsecase = require('../../../use-case/MusicSource/softDeleteMusicSource')({ MusicSourceDb });
const softDeleteManyMusicSourceUsecase = require('../../../use-case/MusicSource/softDeleteManyMusicSource')({ MusicSourceDb });
const bulkInsertMusicSourceUsecase = require('../../../use-case/MusicSource/bulkInsertMusicSource')({ MusicSourceDb });
const bulkUpdateMusicSourceUsecase = require('../../../use-case/MusicSource/bulkUpdateMusicSource')({ MusicSourceDb });
const deleteMusicSourceUsecase = require('../../../use-case/MusicSource/deleteMusicSource')({ MusicSourceDb });
const deleteManyMusicSourceUsecase = require('../../../use-case/MusicSource/deleteManyMusicSource')({ MusicSourceDb });

// controller methods mapping
const addMusicSource = MusicSourceController.addMusicSource(addMusicSourceUsecase);
const findAllMusicSource = MusicSourceController.findAllMusicSource(findAllMusicSourceUsecase);
const getMusicSourceCount = MusicSourceController.getMusicSourceCount(getMusicSourceCountUsecase);
const getMusicSourceById = MusicSourceController.getMusicSource(getMusicSourceUsecase);
const updateMusicSource = MusicSourceController.updateMusicSource(updateMusicSourceUsecase);
const partialUpdateMusicSource = MusicSourceController.partialUpdateMusicSource(partialUpdateMusicSourceUsecase);
const softDeleteMusicSource = MusicSourceController.softDeleteMusicSource(softDeleteMusicSourceUsecase);
const softDeleteManyMusicSource = MusicSourceController.softDeleteManyMusicSource(softDeleteManyMusicSourceUsecase);
const bulkInsertMusicSource = MusicSourceController.bulkInsertMusicSource(bulkInsertMusicSourceUsecase);
const bulkUpdateMusicSource = MusicSourceController.bulkUpdateMusicSource(bulkUpdateMusicSourceUsecase);
const deleteMusicSource = MusicSourceController.deleteMusicSource(deleteMusicSourceUsecase);
const deleteManyMusicSource = MusicSourceController.deleteManyMusicSource(deleteManyMusicSourceUsecase);

module.exports = {
  addMusicSource,
  findAllMusicSource,
  getMusicSourceCount,
  getMusicSourceById,
  updateMusicSource,
  partialUpdateMusicSource,
  softDeleteMusicSource,
  softDeleteManyMusicSource,
  bulkInsertMusicSource,
  bulkUpdateMusicSource,
  deleteMusicSource,
  deleteManyMusicSource,
};