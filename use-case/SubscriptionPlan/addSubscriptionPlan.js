
/**
 *addSubscriptionPlan.js
 */

const  SubscriptionPlanEntity = require('../../entities/SubscriptionPlan');
const response = require('../../utils/response');

/**
 * @description : create new record of SubscriptionPlan in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addSubscriptionPlan = ({
  SubscriptionPlanDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdSubscriptionPlan  = SubscriptionPlanEntity(dataToCreate);
  createdSubscriptionPlan = await SubscriptionPlanDb.createOne(createdSubscriptionPlan );
  return response.success({ data:createdSubscriptionPlan });
};
module.exports = addSubscriptionPlan;