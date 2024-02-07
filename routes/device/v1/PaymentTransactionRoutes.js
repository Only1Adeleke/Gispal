const express = require('express');
const router = express.Router();
const PaymentTransactionController = require('../../../controller/device/v1/PaymentTransaction');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/paymenttransaction/create').post(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.addPaymentTransaction);
router.route('/device/api/v1/paymenttransaction/list').post(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.findAllPaymentTransaction);

router.route('/device/api/v1/paymenttransaction/count').post(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.getPaymentTransactionCount);
router.route('/device/api/v1/paymenttransaction/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.getPaymentTransactionById);

router.route('/device/api/v1/paymenttransaction/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.updatePaymentTransaction);   
router.route('/device/api/v1/paymenttransaction/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.partialUpdatePaymentTransaction);   

router.route('/device/api/v1/paymenttransaction/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.softDeletePaymentTransaction);
router.route('/device/api/v1/paymenttransaction/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.softDeleteManyPaymentTransaction);
router.route('/device/api/v1/paymenttransaction/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.bulkInsertPaymentTransaction);

router.route('/device/api/v1/paymenttransaction/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.bulkUpdatePaymentTransaction); 
router.route('/device/api/v1/paymenttransaction/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.deletePaymentTransaction);
router.route('/device/api/v1/paymenttransaction/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,PaymentTransactionController.deleteManyPaymentTransaction);

module.exports = router;
