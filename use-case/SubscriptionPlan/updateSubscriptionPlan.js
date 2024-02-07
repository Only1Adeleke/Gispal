/**
 *updateSubscriptionPlan.js
 */

const  SubscriptionPlanEntity = require('../../entities/SubscriptionPlan');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated SubscriptionPlan. {status, message, data}
 */
const updateSubscriptionPlan = ({
  SubscriptionPlanDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedSubscriptionPlan = SubscriptionPlanEntity(dataToUpdate);
  updatedSubscriptionPlan = await SubscriptionPlanDb.update(query,updatedSubscriptionPlan);
  if (!updatedSubscriptionPlan || updatedSubscriptionPlan.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedSubscriptionPlan[0] });
};
module.exports = updateSubscriptionPlan;