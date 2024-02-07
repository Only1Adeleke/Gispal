/**
 *updatePaymentTransaction.js
 */

const  PaymentTransactionEntity = require('../../entities/PaymentTransaction');
const response = require('../../utils/response');

/**
 * @description : update record with data by id.
 * @param {Object} params : request body including query and data.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : updated PaymentTransaction. {status, message, data}
 */
const updatePaymentTransaction = ({
  PaymentTransactionDb, updateValidation
}) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const validateRequest = await updateValidation(dataToUpdate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let updatedPaymentTransaction = PaymentTransactionEntity(dataToUpdate);
  updatedPaymentTransaction = await PaymentTransactionDb.update(query,updatedPaymentTransaction);
  if (!updatedPaymentTransaction || updatedPaymentTransaction.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedPaymentTransaction[0] });
};
module.exports = updatePaymentTransaction;