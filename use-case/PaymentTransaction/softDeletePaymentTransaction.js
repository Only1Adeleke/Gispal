/**
 *softDeletePaymentTransaction.js
 */

const response = require('../../utils/response');

/**
 * @description : soft delete record from database by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response..
 * @return {Object} : deactivated PaymentTransaction. {status, message, data}
 */
const softDeletePaymentTransaction = ({ PaymentTransactionDb }) => async (params,req,res) => {
  let {
    query, dataToUpdate 
  } = params;
  let updatedPaymentTransaction = await PaymentTransactionDb.update(query, dataToUpdate);
  if (!updatedPaymentTransaction || updatedPaymentTransaction.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedPaymentTransaction[0] });
};
module.exports = softDeletePaymentTransaction;
