const SubscriptionPlanDb = require('../../../../data-access/SubscriptionPlanDb');
const userDb = require('../../../../data-access/userDb');
const SubscriptionPlanSchema = require('../../../../validation/schema/SubscriptionPlan');
const createValidation = require('../../../../validation')(SubscriptionPlanSchema.createSchema);
const updateValidation = require('../../../../validation')(SubscriptionPlanSchema.updateSchema);
const filterValidation = require('../../../../validation')(SubscriptionPlanSchema.filterValidationSchema);
const SubscriptionPlanController = require('./SubscriptionPlan');

// use-cases imports with dependency injection
const addSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/addSubscriptionPlan')({
  SubscriptionPlanDb,
  createValidation 
});
const findAllSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/findAllSubscriptionPlan')({
  SubscriptionPlanDb,
  filterValidation
});
const getSubscriptionPlanCountUsecase = require('../../../../use-case/SubscriptionPlan/getSubscriptionPlanCount')({
  SubscriptionPlanDb,
  filterValidation
});
const getSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/getSubscriptionPlan')({
  SubscriptionPlanDb,
  filterValidation
});
const updateSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/updateSubscriptionPlan')({
  SubscriptionPlanDb,
  updateValidation 
});
const partialUpdateSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/partialUpdateSubscriptionPlan')({
  SubscriptionPlanDb,
  updateValidation
});
const softDeleteSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/softDeleteSubscriptionPlan')({
  SubscriptionPlanDb,
  userDb
});
const softDeleteManySubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/softDeleteManySubscriptionPlan')({
  SubscriptionPlanDb,
  userDb
});
const bulkInsertSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/bulkInsertSubscriptionPlan')({ SubscriptionPlanDb });
const bulkUpdateSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/bulkUpdateSubscriptionPlan')({ SubscriptionPlanDb });
const deleteSubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/deleteSubscriptionPlan')({
  SubscriptionPlanDb,
  userDb
});
const deleteManySubscriptionPlanUsecase = require('../../../../use-case/SubscriptionPlan/deleteManySubscriptionPlan')({
  SubscriptionPlanDb,
  userDb
});

// controller methods mapping
const addSubscriptionPlan = SubscriptionPlanController.addSubscriptionPlan(addSubscriptionPlanUsecase);
const findAllSubscriptionPlan = SubscriptionPlanController.findAllSubscriptionPlan(findAllSubscriptionPlanUsecase);
const getSubscriptionPlanCount = SubscriptionPlanController.getSubscriptionPlanCount(getSubscriptionPlanCountUsecase);
const getSubscriptionPlanById = SubscriptionPlanController.getSubscriptionPlan(getSubscriptionPlanUsecase);
const updateSubscriptionPlan = SubscriptionPlanController.updateSubscriptionPlan(updateSubscriptionPlanUsecase);
const partialUpdateSubscriptionPlan = SubscriptionPlanController.partialUpdateSubscriptionPlan(partialUpdateSubscriptionPlanUsecase);
const softDeleteSubscriptionPlan = SubscriptionPlanController.softDeleteSubscriptionPlan(softDeleteSubscriptionPlanUsecase);
const softDeleteManySubscriptionPlan = SubscriptionPlanController.softDeleteManySubscriptionPlan(softDeleteManySubscriptionPlanUsecase);
const bulkInsertSubscriptionPlan = SubscriptionPlanController.bulkInsertSubscriptionPlan(bulkInsertSubscriptionPlanUsecase);
const bulkUpdateSubscriptionPlan = SubscriptionPlanController.bulkUpdateSubscriptionPlan(bulkUpdateSubscriptionPlanUsecase);
const deleteSubscriptionPlan = SubscriptionPlanController.deleteSubscriptionPlan(deleteSubscriptionPlanUsecase);
const deleteManySubscriptionPlan = SubscriptionPlanController.deleteManySubscriptionPlan(deleteManySubscriptionPlanUsecase);

module.exports = {
  addSubscriptionPlan,
  findAllSubscriptionPlan,
  getSubscriptionPlanCount,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  partialUpdateSubscriptionPlan,
  softDeleteSubscriptionPlan,
  softDeleteManySubscriptionPlan,
  bulkInsertSubscriptionPlan,
  bulkUpdateSubscriptionPlan,
  deleteSubscriptionPlan,
  deleteManySubscriptionPlan,
};