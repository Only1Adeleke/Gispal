module.exports = (SubscriptionPlan) => {

  let newSubscriptionPlan = { 
    id: SubscriptionPlan.id,
    isDeleted: SubscriptionPlan.isDeleted,
    name: SubscriptionPlan.name,
    price: SubscriptionPlan.price,
    features: SubscriptionPlan.features,
    duration_months: SubscriptionPlan.duration_months,
  };

  // remove undefined values
  if (newSubscriptionPlan.id){
    Object.keys(newSubscriptionPlan).forEach(key =>{
      if (newSubscriptionPlan[key] === undefined) return newSubscriptionPlan[key] = null;
    });
  } else {
    Object.keys(newSubscriptionPlan).forEach(key => newSubscriptionPlan[key] === undefined && delete newSubscriptionPlan[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newSubscriptionPlan) => {
   *   if (!newSubscriptionPlan.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newSubscriptionPlan) 
   */
  return Object.freeze(newSubscriptionPlan);
};
