/**
 *partialUpdatePaymentTransaction.js
 */

const  PaymentTransactionEntity = require('../../entities/PaymentTransaction');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated PaymentTransaction. {status, message, data}
 */
const partialUpdatePaymentTransaction = ({ PaymentTransactionDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedPaymentTransaction = await PaymentTransactionDb.update(query,dataToUpdate);
  if (!updatedPaymentTransaction || updatedPaymentTransaction.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedPaymentTransaction[0] });
};
module.exports = partialUpdatePaymentTransaction;