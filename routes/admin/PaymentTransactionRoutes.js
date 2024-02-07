const express = require('express');
const router = express.Router();
const PaymentTransactionController = require('../../controller/admin/PaymentTransaction');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/paymenttransaction/create').post(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.addPaymentTransaction);
router.route('/admin/paymenttransaction/list').post(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.findAllPaymentTransaction);

router.route('/admin/paymenttransaction/count').post(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.getPaymentTransactionCount);
router.route('/admin/paymenttransaction/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.getPaymentTransactionById);

router.route('/admin/paymenttransaction/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.updatePaymentTransaction);   
router.route('/admin/paymenttransaction/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.partialUpdatePaymentTransaction);   

router.route('/admin/paymenttransaction/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.softDeletePaymentTransaction);
router.route('/admin/paymenttransaction/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.softDeleteManyPaymentTransaction);
router.route('/admin/paymenttransaction/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.bulkInsertPaymentTransaction);

router.route('/admin/paymenttransaction/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.bulkUpdatePaymentTransaction); 
router.route('/admin/paymenttransaction/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.deletePaymentTransaction);
router.route('/admin/paymenttransaction/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,PaymentTransactionController.deleteManyPaymentTransaction);

module.exports = router;
