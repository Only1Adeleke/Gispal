
/**
 *bulkInsertPaymentTransaction.js
 */

const  PaymentTransactionEntity = require('../../entities/PaymentTransaction');
const response = require('../../utils/response');

/**
 * @description : create multiple records in database.
 * @param {Object} dataToCreate : data for creating documents.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : created PaymentTransactions. {status, message, data}
 */
const bulkInsertPaymentTransaction = ({
  PaymentTransactionDb,createValidation 
}) => async (dataToCreate,req,res) => {
  let paymenttransactionEntities = dataToCreate.map(item => PaymentTransactionEntity(item));
  let createdPaymentTransaction = await PaymentTransactionDb.createMany(paymenttransactionEntities);
  return response.success({ data:{ count: createdPaymentTransaction.length } });
};
module.exports = bulkInsertPaymentTransaction;