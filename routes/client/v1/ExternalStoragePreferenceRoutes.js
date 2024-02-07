const express = require('express');
const router = express.Router();
const ExternalStoragePreferenceController = require('../../../controller/client/v1/ExternalStoragePreference');
const {
  auth,checkRolePermission,
} = require('../../../middleware');
const { PLATFORM } =  require('../../../constants/authConstant');
router.route('/client/api/v1/externalstoragepreference/create').post(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.addExternalStoragePreference);
router.route('/client/api/v1/externalstoragepreference/list').post(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.findAllExternalStoragePreference);

router.route('/client/api/v1/externalstoragepreference/count').post(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.getExternalStoragePreferenceCount);
router.route('/client/api/v1/externalstoragepreference/:id').get(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.getExternalStoragePreferenceById);

router.route('/client/api/v1/externalstoragepreference/update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.updateExternalStoragePreference);   
router.route('/client/api/v1/externalstoragepreference/partial-update/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.partialUpdateExternalStoragePreference);   

router.route('/client/api/v1/externalstoragepreference/softDelete/:id').put(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.softDeleteExternalStoragePreference);
router.route('/client/api/v1/externalstoragepreference/softDeleteMany').put(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.softDeleteManyExternalStoragePreference);
router.route('/client/api/v1/externalstoragepreference/addBulk').post(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.bulkInsertExternalStoragePreference);

router.route('/client/api/v1/externalstoragepreference/updateBulk').put(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.bulkUpdateExternalStoragePreference); 
router.route('/client/api/v1/externalstoragepreference/delete/:id').delete(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.deleteExternalStoragePreference);
router.route('/client/api/v1/externalstoragepreference/deleteMany').post(auth(PLATFORM.CLIENT),checkRolePermission,ExternalStoragePreferenceController.deleteManyExternalStoragePreference);

module.exports = router;
