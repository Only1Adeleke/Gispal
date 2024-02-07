/**
 *partialUpdateSubscriptionPlan.js
 */

const  SubscriptionPlanEntity = require('../../entities/SubscriptionPlan');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated SubscriptionPlan. {status, message, data}
 */
const partialUpdateSubscriptionPlan = ({ SubscriptionPlanDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedSubscriptionPlan = await SubscriptionPlanDb.update(query,dataToUpdate);
  if (!updatedSubscriptionPlan || updatedSubscriptionPlan.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedSubscriptionPlan[0] });
};
module.exports = partialUpdateSubscriptionPlan;