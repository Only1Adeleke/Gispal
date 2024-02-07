const express = require('express');
const router = express.Router();
const PaymentTransactionController = require('../../../controller/client/v1/PaymentTransaction');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/paymenttransaction/create').post(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.addPaymentTransaction);
router.route('/client/api/v1/paymenttransaction/list').post(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.findAllPaymentTransaction);

router.route('/client/api/v1/paymenttransaction/count').post(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.getPaymentTransactionCount);
router.route('/client/api/v1/paymenttransaction/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.getPaymentTransactionById);

router.route('/client/api/v1/paymenttransaction/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.updatePaymentTransaction);   
router.route('/client/api/v1/paymenttransaction/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.partialUpdatePaymentTransaction);   

router.route('/client/api/v1/paymenttransaction/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.softDeletePaymentTransaction);
router.route('/client/api/v1/paymenttransaction/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.softDeleteManyPaymentTransaction);
router.route('/client/api/v1/paymenttransaction/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.bulkInsertPaymentTransaction);

router.route('/client/api/v1/paymenttransaction/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.bulkUpdatePaymentTransaction); 
router.route('/client/api/v1/paymenttransaction/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.deletePaymentTransaction);
router.route('/client/api/v1/paymenttransaction/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,PaymentTransactionController.deleteManyPaymentTransaction);

module.exports = router;
