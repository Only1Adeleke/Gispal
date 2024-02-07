
/**
 *addPaymentTransaction.js
 */

const  PaymentTransactionEntity = require('../../entities/PaymentTransaction');
const response = require('../../utils/response');

/**
 * @description : create new record of PaymentTransaction in database.
 * @param {Object} dataToCreate : data for create new document.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : response of create. {status, message, data}
 */
const addPaymentTransaction = ({
  PaymentTransactionDb,createValidation 
}) => async (dataToCreate,req,res) => {
  const validateRequest = await createValidation(dataToCreate);
  if (!validateRequest.isValid) {
    return response.validationError({ message : `Invalid values in parameters, ${validateRequest.message}` });
  }
  let createdPaymentTransaction  = PaymentTransactionEntity(dataToCreate);
  createdPaymentTransaction = await PaymentTransactionDb.createOne(createdPaymentTransaction );
  return response.success({ data:createdPaymentTransaction });
};
module.exports = addPaymentTransaction;