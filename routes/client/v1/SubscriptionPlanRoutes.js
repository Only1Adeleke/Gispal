const express = require('express');
const router = express.Router();
const SubscriptionPlanController = require('../../../controller/client/v1/SubscriptionPlan');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/subscriptionplan/create').post(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.addSubscriptionPlan);
router.route('/client/api/v1/subscriptionplan/list').post(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.findAllSubscriptionPlan);

router.route('/client/api/v1/subscriptionplan/count').post(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.getSubscriptionPlanCount);
router.route('/client/api/v1/subscriptionplan/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.getSubscriptionPlanById);

router.route('/client/api/v1/subscriptionplan/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.updateSubscriptionPlan);   
router.route('/client/api/v1/subscriptionplan/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.partialUpdateSubscriptionPlan);   

router.route('/client/api/v1/subscriptionplan/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.softDeleteSubscriptionPlan);
router.route('/client/api/v1/subscriptionplan/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.softDeleteManySubscriptionPlan);
router.route('/client/api/v1/subscriptionplan/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.bulkInsertSubscriptionPlan);

router.route('/client/api/v1/subscriptionplan/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.bulkUpdateSubscriptionPlan); 
router.route('/client/api/v1/subscriptionplan/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.deleteSubscriptionPlan);
router.route('/client/api/v1/subscriptionplan/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,SubscriptionPlanController.deleteManySubscriptionPlan);

module.exports = router;
