const express = require('express');
const router = express.Router();
const ExternalStoragePreferenceController = require('../../../controller/device/v1/ExternalStoragePreference');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/device/api/v1/externalstoragepreference/create').post(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.addExternalStoragePreference);
router.route('/device/api/v1/externalstoragepreference/list').post(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.findAllExternalStoragePreference);

router.route('/device/api/v1/externalstoragepreference/count').post(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.getExternalStoragePreferenceCount);
router.route('/device/api/v1/externalstoragepreference/:id').get(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.getExternalStoragePreferenceById);

router.route('/device/api/v1/externalstoragepreference/update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.updateExternalStoragePreference);   
router.route('/device/api/v1/externalstoragepreference/partial-update/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.partialUpdateExternalStoragePreference);   

router.route('/device/api/v1/externalstoragepreference/softDelete/:id').put(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.softDeleteExternalStoragePreference);
router.route('/device/api/v1/externalstoragepreference/softDeleteMany').put(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.softDeleteManyExternalStoragePreference);
router.route('/device/api/v1/externalstoragepreference/addBulk').post(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.bulkInsertExternalStoragePreference);

router.route('/device/api/v1/externalstoragepreference/updateBulk').put(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.bulkUpdateExternalStoragePreference); 
router.route('/device/api/v1/externalstoragepreference/delete/:id').delete(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.deleteExternalStoragePreference);
router.route('/device/api/v1/externalstoragepreference/deleteMany').post(auth(PLATFORM.DEVICE),checkRolePermission,ExternalStoragePreferenceController.deleteManyExternalStoragePreference);

module.exports = router;
