const express = require('express');
const router = express.Router();
const ExternalStoragePreferenceController = require('../../controller/admin/ExternalStoragePreference');
const {
  auth,checkRolePermission,
} = require('../../middleware');
const { PLATFORM } =  require('../../constants/authConstant');
router.route('/admin/externalstoragepreference/create').post(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.addExternalStoragePreference);
router.route('/admin/externalstoragepreference/list').post(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.findAllExternalStoragePreference);

router.route('/admin/externalstoragepreference/count').post(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.getExternalStoragePreferenceCount);
router.route('/admin/externalstoragepreference/:id').get(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.getExternalStoragePreferenceById);

router.route('/admin/externalstoragepreference/update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.updateExternalStoragePreference);   
router.route('/admin/externalstoragepreference/partial-update/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.partialUpdateExternalStoragePreference);   

router.route('/admin/externalstoragepreference/softDelete/:id').put(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.softDeleteExternalStoragePreference);
router.route('/admin/externalstoragepreference/softDeleteMany').put(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.softDeleteManyExternalStoragePreference);
router.route('/admin/externalstoragepreference/addBulk').post(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.bulkInsertExternalStoragePreference);

router.route('/admin/externalstoragepreference/updateBulk').put(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.bulkUpdateExternalStoragePreference); 
router.route('/admin/externalstoragepreference/delete/:id').delete(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.deleteExternalStoragePreference);
router.route('/admin/externalstoragepreference/deleteMany').post(auth(PLATFORM.ADMIN),checkRolePermission,ExternalStoragePreferenceController.deleteManyExternalStoragePreference);

module.exports = router;
