const express = require('express');
const router = express.Router();
const SubscriptionPlanController = require('../../controller/admin/SubscriptionPlan');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/subscriptionplan/create').post(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.addSubscriptionPlan);
router.route('/admin/subscriptionplan/list').post(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.findAllSubscriptionPlan);

router.route('/admin/subscriptionplan/count').post(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.getSubscriptionPlanCount);
router.route('/admin/subscriptionplan/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.getSubscriptionPlanById);

router.route('/admin/subscriptionplan/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.updateSubscriptionPlan);   
router.route('/admin/subscriptionplan/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.partialUpdateSubscriptionPlan);   

router.route('/admin/subscriptionplan/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.softDeleteSubscriptionPlan);
router.route('/admin/subscriptionplan/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.softDeleteManySubscriptionPlan);
router.route('/admin/subscriptionplan/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.bulkInsertSubscriptionPlan);

router.route('/admin/subscriptionplan/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.bulkUpdateSubscriptionPlan); 
router.route('/admin/subscriptionplan/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.deleteSubscriptionPlan);
router.route('/admin/subscriptionplan/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,SubscriptionPlanController.deleteManySubscriptionPlan);

module.exports = router;
