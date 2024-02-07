module.exports = (pushNotification) => {

  let newPushNotification = { 
    id: pushNotification.id,
    userId: pushNotification.userId,
    deviceId: pushNotification.deviceId,
    playerId: pushNotification.playerId,
    isActive: pushNotification.isActive,
    isDeleted: pushNotification.isDeleted,
  };

  // remove undefined values
  if (newPushNotification.id){
    Object.keys(newPushNotification).forEach(key =>{
      if (newPushNotification[key] === undefined) return newPushNotification[key] = null;
    });
  } else {
    Object.keys(newPushNotification).forEach(key => newPushNotification[key] === undefined && delete newPushNotification[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newPushNotification) => {
   *   if (!newPushNotification.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newPushNotification) 
   */
  return Object.freeze(newPushNotification);
};
