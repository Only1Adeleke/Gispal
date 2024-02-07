module.exports = (Notification) => {

  let newNotification = { 
    id: Notification.id,
    isDeleted: Notification.isDeleted,
    user_id: Notification.user_id,
    content: Notification.content,
    is_read: Notification.is_read,
    created_at: Notification.created_at,
  };

  // remove undefined values
  if (newNotification.id){
    Object.keys(newNotification).forEach(key =>{
      if (newNotification[key] === undefined) return newNotification[key] = null;
    });
  } else {
    Object.keys(newNotification).forEach(key => newNotification[key] === undefined && delete newNotification[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newNotification) => {
   *   if (!newNotification.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newNotification) 
   */
  return Object.freeze(newNotification);
};
