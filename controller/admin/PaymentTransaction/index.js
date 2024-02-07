const PaymentTransactionDb = require('../../../data-access/PaymentTransactionDb');
const PaymentTransactionSchema = require('../../../validation/schema/PaymentTransaction');
const createValidation = require('../../../validation')(PaymentTransactionSchema.createSchema);
const updateValidation = require('../../../validation')(PaymentTransactionSchema.updateSchema);
const filterValidation = require('../../../validation')(PaymentTransactionSchema.filterValidationSchema);
const PaymentTransactionController = require('./PaymentTransaction');

// use-cases imports with dependency injection
const addPaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/addPaymentTransaction')({
  PaymentTransactionDb,
  createValidation 
});
const findAllPaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/findAllPaymentTransaction')({
  PaymentTransactionDb,
  filterValidation
});
const getPaymentTransactionCountUsecase = require('../../../use-case/PaymentTransaction/getPaymentTransactionCount')({
  PaymentTransactionDb,
  filterValidation
});
const getPaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/getPaymentTransaction')({
  PaymentTransactionDb,
  filterValidation
});
const updatePaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/updatePaymentTransaction')({
  PaymentTransactionDb,
  updateValidation 
});
const partialUpdatePaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/partialUpdatePaymentTransaction')({
  PaymentTransactionDb,
  updateValidation
});
const softDeletePaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/softDeletePaymentTransaction')({ PaymentTransactionDb });
const softDeleteManyPaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/softDeleteManyPaymentTransaction')({ PaymentTransactionDb });
const bulkInsertPaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/bulkInsertPaymentTransaction')({ PaymentTransactionDb });
const bulkUpdatePaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/bulkUpdatePaymentTransaction')({ PaymentTransactionDb });
const deletePaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/deletePaymentTransaction')({ PaymentTransactionDb });
const deleteManyPaymentTransactionUsecase = require('../../../use-case/PaymentTransaction/deleteManyPaymentTransaction')({ PaymentTransactionDb });

// controller methods mapping
const addPaymentTransaction = PaymentTransactionController.addPaymentTransaction(addPaymentTransactionUsecase);
const findAllPaymentTransaction = PaymentTransactionController.findAllPaymentTransaction(findAllPaymentTransactionUsecase);
const getPaymentTransactionCount = PaymentTransactionController.getPaymentTransactionCount(getPaymentTransactionCountUsecase);
const getPaymentTransactionById = PaymentTransactionController.getPaymentTransaction(getPaymentTransactionUsecase);
const updatePaymentTransaction = PaymentTransactionController.updatePaymentTransaction(updatePaymentTransactionUsecase);
const partialUpdatePaymentTransaction = PaymentTransactionController.partialUpdatePaymentTransaction(partialUpdatePaymentTransactionUsecase);
const softDeletePaymentTransaction = PaymentTransactionController.softDeletePaymentTransaction(softDeletePaymentTransactionUsecase);
const softDeleteManyPaymentTransaction = PaymentTransactionController.softDeleteManyPaymentTransaction(softDeleteManyPaymentTransactionUsecase);
const bulkInsertPaymentTransaction = PaymentTransactionController.bulkInsertPaymentTransaction(bulkInsertPaymentTransactionUsecase);
const bulkUpdatePaymentTransaction = PaymentTransactionController.bulkUpdatePaymentTransaction(bulkUpdatePaymentTransactionUsecase);
const deletePaymentTransaction = PaymentTransactionController.deletePaymentTransaction(deletePaymentTransactionUsecase);
const deleteManyPaymentTransaction = PaymentTransactionController.deleteManyPaymentTransaction(deleteManyPaymentTransactionUsecase);

module.exports = {
  addPaymentTransaction,
  findAllPaymentTransaction,
  getPaymentTransactionCount,
  getPaymentTransactionById,
  updatePaymentTransaction,
  partialUpdatePaymentTransaction,
  softDeletePaymentTransaction,
  softDeleteManyPaymentTransaction,
  bulkInsertPaymentTransaction,
  bulkUpdatePaymentTransaction,
  deletePaymentTransaction,
  deleteManyPaymentTransaction,
};