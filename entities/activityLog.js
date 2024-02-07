module.exports = (activityLog) => {

  let newActivityLog = { 
    id: activityLog.id,
    body: activityLog.body,
    params: activityLog.params,
    route: activityLog.route,
    module: activityLog.module,
    action: activityLog.action,
    referenceId: activityLog.referenceId,
    loggedInUser: activityLog.loggedInUser,
    method: activityLog.method,
    isDeleted: activityLog.isDeleted,
  };

  // remove undefined values
  if (newActivityLog.id){
    Object.keys(newActivityLog).forEach(key =>{
      if (newActivityLog[key] === undefined) return newActivityLog[key] = null;
    });
  } else {
    Object.keys(newActivityLog).forEach(key => newActivityLog[key] === undefined && delete newActivityLog[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newActivityLog) => {
   *   if (!newActivityLog.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newActivityLog) 
   */
  return Object.freeze(newActivityLog);
};
