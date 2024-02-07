module.exports = (ExternalStoragePreference) => {

  let newExternalStoragePreference = { 
    id: ExternalStoragePreference.id,
    isDeleted: ExternalStoragePreference.isDeleted,
    user_id: ExternalStoragePreference.user_id,
    storage_location: ExternalStoragePreference.storage_location,
  };

  // remove undefined values
  if (newExternalStoragePreference.id){
    Object.keys(newExternalStoragePreference).forEach(key =>{
      if (newExternalStoragePreference[key] === undefined) return newExternalStoragePreference[key] = null;
    });
  } else {
    Object.keys(newExternalStoragePreference).forEach(key => newExternalStoragePreference[key] === undefined && delete newExternalStoragePreference[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newExternalStoragePreference) => {
   *   if (!newExternalStoragePreference.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newExternalStoragePreference) 
   */
  return Object.freeze(newExternalStoragePreference);
};
