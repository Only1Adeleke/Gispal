
/**
 *deletePaymentTransaction.js
 */

const response = require('../../utils/response');
    
/**
 * @description : delete record from database.
 * @param {Object} query : query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : deleted PaymentTransaction. {status, message, data}
 */
const deletePaymentTransaction = ({ PaymentTransactionDb }) => async (params, req, res) => {
  let { query } = params;
  let deletedPaymentTransaction = await PaymentTransactionDb.destroy(query);
  if (!deletedPaymentTransaction || deletedPaymentTransaction.length == 0){
    return response.recordNotFound({ });
  }
  return response.success({ data: deletedPaymentTransaction[0] });
};

module.exports = deletePaymentTransaction;
