const express =  require('express');
const router =  express.Router();
router.use('/admin/auth',require('./auth'));
router.use(require('./VideoSourceRoutes'));
router.use(require('./MusicSourceRoutes'));
router.use(require('./NotificationRoutes'));
router.use(require('./PaymentTransactionRoutes'));
router.use(require('./ExternalStoragePreferenceRoutes'));
router.use(require('./AnnouncementRoutes'));
router.use(require('./ProcessedFileRoutes'));
router.use(require('./SubscriptionPlanRoutes'));
router.use(require('./userRoutes'));
router.use(require('./roleRoutes'));
router.use(require('./projectRouteRoutes'));
router.use(require('./routeRoleRoutes'));
router.use(require('./userRoleRoutes'));
router.use(require('./uploadRoutes'));

module.exports = router;
