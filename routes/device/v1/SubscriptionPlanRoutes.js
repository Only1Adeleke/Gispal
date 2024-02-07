const express = require('express');
const router = express.Router();
const SubscriptionPlanController = require('../../../controller/device/v1/SubscriptionPlan');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/subscriptionplan/create').post(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.addSubscriptionPlan);
router.route('/device/api/v1/subscriptionplan/list').post(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.findAllSubscriptionPlan);

router.route('/device/api/v1/subscriptionplan/count').post(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.getSubscriptionPlanCount);
router.route('/device/api/v1/subscriptionplan/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.getSubscriptionPlanById);

router.route('/device/api/v1/subscriptionplan/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.updateSubscriptionPlan);   
router.route('/device/api/v1/subscriptionplan/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.partialUpdateSubscriptionPlan);   

router.route('/device/api/v1/subscriptionplan/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.softDeleteSubscriptionPlan);
router.route('/device/api/v1/subscriptionplan/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.softDeleteManySubscriptionPlan);
router.route('/device/api/v1/subscriptionplan/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.bulkInsertSubscriptionPlan);

router.route('/device/api/v1/subscriptionplan/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.bulkUpdateSubscriptionPlan); 
router.route('/device/api/v1/subscriptionplan/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.deleteSubscriptionPlan);
router.route('/device/api/v1/subscriptionplan/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,SubscriptionPlanController.deleteManySubscriptionPlan);

module.exports = router;
