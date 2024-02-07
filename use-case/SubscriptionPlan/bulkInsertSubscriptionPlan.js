
/**
 *bulkInsertSubscriptionPlan.js
 */

const  SubscriptionPlanEntity = require('../../entities/SubscriptionPlan');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created SubscriptionPlans. {status, message, data}
 */
const bulkInsertSubscriptionPlan = ({
  SubscriptionPlanDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let subscriptionplanEntities = dataToCreate.map(item => SubscriptionPlanEntity(item));
  let createdSubscriptionPlan = await SubscriptionPlanDb.createMany(subscriptionplanEntities);
  return response.success({ data:{ count: createdSubscriptionPlan.length } });
};
module.exports = bulkInsertSubscriptionPlan;