const response = require('../../utils/response');

const getDependencyCount = ({
  SubscriptionPlanDb,userDb
})=> async (filter) =>{
  let SubscriptionPlan = await SubscriptionPlanDb.findAll(filter);
  if (SubscriptionPlan.length){
    let SubscriptionPlanIds = SubscriptionPlan.map((obj) => obj.id);

    const userFilter = { '$or': [{ subscription_plan_id : { '$in' : SubscriptionPlanIds } }] };
    const userCnt =  await userDb.count(userFilter);
    let result = { user :userCnt , };
    return response.success({
      message: 'No of Dependency found',
      data: result
    });
  } else {
    return response.success({
      message: 'No of Dependency found',
      data: {  SubscriptionPlan : 0 }
    });
  }
};

const deleteWithDependency = ({
  SubscriptionPlanDb,userDb
})=> async (filter) =>{
  let SubscriptionPlan = await SubscriptionPlanDb.findAll(filter);
  if (SubscriptionPlan.length){
    let SubscriptionPlanIds = SubscriptionPlan.map((obj) => obj.id);

    const userFilter = { '$or': [{ subscription_plan_id : { '$in' : SubscriptionPlanIds } }] };
    const userCnt =  (await userDb.destroy(userFilter)).length;
    let deleted = (await SubscriptionPlanDb.destroy(filter)).length;
    let result = { user :userCnt , };
    return response.success({
      message: 'No of Dependency deleted',
      data: result
    });
  } else {
    return response.success({
      message: 'No of Dependency deleted',
      data: {  SubscriptionPlan : 0 }
    });
  }
};

const softDeleteWithDependency = ({
  SubscriptionPlanDb,userDb
}) => async (filter,updateBody) =>{
  let SubscriptionPlan = await SubscriptionPlanDb.findAll(filter);
  if (SubscriptionPlan.length){
    let SubscriptionPlanIds = SubscriptionPlan.map((obj) => obj.id);

    const userFilter = { '$or': [{ subscription_plan_id : { '$in' : SubscriptionPlanIds } }] };
    const userCnt =  (await userDb.update(userFilter,updateBody)).length;
    let updated = (await SubscriptionPlanDb.update(filter,updateBody)).length;
    let result = { user :userCnt , };
    return response.success({
      message: 'No of Dependency deleted',
      data: result
    });
  } else {
    return response.success({
      message: 'No of Dependency deleted',
      data: {  SubscriptionPlan : 0 }
    });
  }
};
module.exports = {
  getDependencyCount,
  deleteWithDependency,
  softDeleteWithDependency
};
