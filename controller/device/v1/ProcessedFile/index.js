const ProcessedFileDb = require('../../../../data-access/ProcessedFileDb');
const ProcessedFileSchema = require('../../../../validation/schema/ProcessedFile');
const createValidation = require('../../../../validation')(ProcessedFileSchema.createSchema);
const updateValidation = require('../../../../validation')(ProcessedFileSchema.updateSchema);
const filterValidation = require('../../../../validation')(ProcessedFileSchema.filterValidationSchema);
const ProcessedFileController = require('./ProcessedFile');

// use-cases imports with dependency injection
const addProcessedFileUsecase = require('../../../../use-case/ProcessedFile/addProcessedFile')({
  ProcessedFileDb,
  createValidation 
});
const findAllProcessedFileUsecase = require('../../../../use-case/ProcessedFile/findAllProcessedFile')({
  ProcessedFileDb,
  filterValidation
});
const getProcessedFileCountUsecase = require('../../../../use-case/ProcessedFile/getProcessedFileCount')({
  ProcessedFileDb,
  filterValidation
});
const getProcessedFileUsecase = require('../../../../use-case/ProcessedFile/getProcessedFile')({
  ProcessedFileDb,
  filterValidation
});
const updateProcessedFileUsecase = require('../../../../use-case/ProcessedFile/updateProcessedFile')({
  ProcessedFileDb,
  updateValidation 
});
const partialUpdateProcessedFileUsecase = require('../../../../use-case/ProcessedFile/partialUpdateProcessedFile')({
  ProcessedFileDb,
  updateValidation
});
const softDeleteProcessedFileUsecase = require('../../../../use-case/ProcessedFile/softDeleteProcessedFile')({ ProcessedFileDb });
const softDeleteManyProcessedFileUsecase = require('../../../../use-case/ProcessedFile/softDeleteManyProcessedFile')({ ProcessedFileDb });
const bulkInsertProcessedFileUsecase = require('../../../../use-case/ProcessedFile/bulkInsertProcessedFile')({ ProcessedFileDb });
const bulkUpdateProcessedFileUsecase = require('../../../../use-case/ProcessedFile/bulkUpdateProcessedFile')({ ProcessedFileDb });
const deleteProcessedFileUsecase = require('../../../../use-case/ProcessedFile/deleteProcessedFile')({ ProcessedFileDb });
const deleteManyProcessedFileUsecase = require('../../../../use-case/ProcessedFile/deleteManyProcessedFile')({ ProcessedFileDb });

// controller methods mapping
const addProcessedFile = ProcessedFileController.addProcessedFile(addProcessedFileUsecase);
const findAllProcessedFile = ProcessedFileController.findAllProcessedFile(findAllProcessedFileUsecase);
const getProcessedFileCount = ProcessedFileController.getProcessedFileCount(getProcessedFileCountUsecase);
const getProcessedFileById = ProcessedFileController.getProcessedFile(getProcessedFileUsecase);
const updateProcessedFile = ProcessedFileController.updateProcessedFile(updateProcessedFileUsecase);
const partialUpdateProcessedFile = ProcessedFileController.partialUpdateProcessedFile(partialUpdateProcessedFileUsecase);
const softDeleteProcessedFile = ProcessedFileController.softDeleteProcessedFile(softDeleteProcessedFileUsecase);
const softDeleteManyProcessedFile = ProcessedFileController.softDeleteManyProcessedFile(softDeleteManyProcessedFileUsecase);
const bulkInsertProcessedFile = ProcessedFileController.bulkInsertProcessedFile(bulkInsertProcessedFileUsecase);
const bulkUpdateProcessedFile = ProcessedFileController.bulkUpdateProcessedFile(bulkUpdateProcessedFileUsecase);
const deleteProcessedFile = ProcessedFileController.deleteProcessedFile(deleteProcessedFileUsecase);
const deleteManyProcessedFile = ProcessedFileController.deleteManyProcessedFile(deleteManyProcessedFileUsecase);

module.exports = {
  addProcessedFile,
  findAllProcessedFile,
  getProcessedFileCount,
  getProcessedFileById,
  updateProcessedFile,
  partialUpdateProcessedFile,
  softDeleteProcessedFile,
  softDeleteManyProcessedFile,
  bulkInsertProcessedFile,
  bulkUpdateProcessedFile,
  deleteProcessedFile,
  deleteManyProcessedFile,
};