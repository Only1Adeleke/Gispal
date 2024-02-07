const ExternalStoragePreferenceDb = require('../../../data-access/ExternalStoragePreferenceDb');
const ExternalStoragePreferenceSchema = require('../../../validation/schema/ExternalStoragePreference');
const createValidation = require('../../../validation')(ExternalStoragePreferenceSchema.createSchema);
const updateValidation = require('../../../validation')(ExternalStoragePreferenceSchema.updateSchema);
const filterValidation = require('../../../validation')(ExternalStoragePreferenceSchema.filterValidationSchema);
const ExternalStoragePreferenceController = require('./ExternalStoragePreference');

// use-cases imports with dependency injection
const addExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/addExternalStoragePreference')({
  ExternalStoragePreferenceDb,
  createValidation 
});
const findAllExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/findAllExternalStoragePreference')({
  ExternalStoragePreferenceDb,
  filterValidation
});
const getExternalStoragePreferenceCountUsecase = require('../../../use-case/ExternalStoragePreference/getExternalStoragePreferenceCount')({
  ExternalStoragePreferenceDb,
  filterValidation
});
const getExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/getExternalStoragePreference')({
  ExternalStoragePreferenceDb,
  filterValidation
});
const updateExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/updateExternalStoragePreference')({
  ExternalStoragePreferenceDb,
  updateValidation 
});
const partialUpdateExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/partialUpdateExternalStoragePreference')({
  ExternalStoragePreferenceDb,
  updateValidation
});
const softDeleteExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/softDeleteExternalStoragePreference')({ ExternalStoragePreferenceDb });
const softDeleteManyExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/softDeleteManyExternalStoragePreference')({ ExternalStoragePreferenceDb });
const bulkInsertExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/bulkInsertExternalStoragePreference')({ ExternalStoragePreferenceDb });
const bulkUpdateExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/bulkUpdateExternalStoragePreference')({ ExternalStoragePreferenceDb });
const deleteExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/deleteExternalStoragePreference')({ ExternalStoragePreferenceDb });
const deleteManyExternalStoragePreferenceUsecase = require('../../../use-case/ExternalStoragePreference/deleteManyExternalStoragePreference')({ ExternalStoragePreferenceDb });

// controller methods mapping
const addExternalStoragePreference = ExternalStoragePreferenceController.addExternalStoragePreference(addExternalStoragePreferenceUsecase);
const findAllExternalStoragePreference = ExternalStoragePreferenceController.findAllExternalStoragePreference(findAllExternalStoragePreferenceUsecase);
const getExternalStoragePreferenceCount = ExternalStoragePreferenceController.getExternalStoragePreferenceCount(getExternalStoragePreferenceCountUsecase);
const getExternalStoragePreferenceById = ExternalStoragePreferenceController.getExternalStoragePreference(getExternalStoragePreferenceUsecase);
const updateExternalStoragePreference = ExternalStoragePreferenceController.updateExternalStoragePreference(updateExternalStoragePreferenceUsecase);
const partialUpdateExternalStoragePreference = ExternalStoragePreferenceController.partialUpdateExternalStoragePreference(partialUpdateExternalStoragePreferenceUsecase);
const softDeleteExternalStoragePreference = ExternalStoragePreferenceController.softDeleteExternalStoragePreference(softDeleteExternalStoragePreferenceUsecase);
const softDeleteManyExternalStoragePreference = ExternalStoragePreferenceController.softDeleteManyExternalStoragePreference(softDeleteManyExternalStoragePreferenceUsecase);
const bulkInsertExternalStoragePreference = ExternalStoragePreferenceController.bulkInsertExternalStoragePreference(bulkInsertExternalStoragePreferenceUsecase);
const bulkUpdateExternalStoragePreference = ExternalStoragePreferenceController.bulkUpdateExternalStoragePreference(bulkUpdateExternalStoragePreferenceUsecase);
const deleteExternalStoragePreference = ExternalStoragePreferenceController.deleteExternalStoragePreference(deleteExternalStoragePreferenceUsecase);
const deleteManyExternalStoragePreference = ExternalStoragePreferenceController.deleteManyExternalStoragePreference(deleteManyExternalStoragePreferenceUsecase);

module.exports = {
  addExternalStoragePreference,
  findAllExternalStoragePreference,
  getExternalStoragePreferenceCount,
  getExternalStoragePreferenceById,
  updateExternalStoragePreference,
  partialUpdateExternalStoragePreference,
  softDeleteExternalStoragePreference,
  softDeleteManyExternalStoragePreference,
  bulkInsertExternalStoragePreference,
  bulkUpdateExternalStoragePreference,
  deleteExternalStoragePreference,
  deleteManyExternalStoragePreference,
};