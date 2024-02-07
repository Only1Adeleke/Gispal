const response = require('../../utils/response');

const getDependencyCount = ({
  userDb,PaymentTransactionDb,AnnouncementDb,ProcessedFileDb,userAuthSettingsDb,userTokensDb,userRoleDb
})=> async (filter) =>{
  let user = await userDb.findAll(filter);
  if (user.length){
    let userIds = user.map((obj) => obj.id);

    const PaymentTransactionFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const PaymentTransactionCnt =  await PaymentTransactionDb.count(PaymentTransactionFilter);

    const AnnouncementFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const AnnouncementCnt =  await AnnouncementDb.count(AnnouncementFilter);

    const ProcessedFileFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const ProcessedFileCnt =  await ProcessedFileDb.count(ProcessedFileFilter);

    const userFilter = { '$or': [{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userCnt =  await userDb.count(userFilter);

    const userAuthSettingsFilter = { '$or': [{ userId : { '$in' : userIds } },{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userAuthSettingsCnt =  await userAuthSettingsDb.count(userAuthSettingsFilter);

    const userTokensFilter = { '$or': [{ userId : { '$in' : userIds } },{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userTokensCnt =  await userTokensDb.count(userTokensFilter);

    const userRoleFilter = { '$or': [{ userId : { '$in' : userIds } }] };
    const userRoleCnt =  await userRoleDb.count(userRoleFilter);
    let result = {
      PaymentTransaction :PaymentTransactionCnt ,
      Announcement :AnnouncementCnt ,
      ProcessedFile :ProcessedFileCnt ,
      user :userCnt + 1,
      userAuthSettings :userAuthSettingsCnt ,
      userTokens :userTokensCnt ,
      userRole :userRoleCnt ,
    };
    return response.success({
      message: 'No of Dependency found',
      data: result
    });
  } else {
    return response.success({
      message: 'No of Dependency found',
      data: {  user : 0 }
    });
  }
};

const deleteWithDependency = ({
  userDb,PaymentTransactionDb,AnnouncementDb,ProcessedFileDb,userAuthSettingsDb,userTokensDb,userRoleDb
})=> async (filter) =>{
  let user = await userDb.findAll(filter);
  if (user.length){
    let userIds = user.map((obj) => obj.id);

    const PaymentTransactionFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const PaymentTransactionCnt =  (await PaymentTransactionDb.destroy(PaymentTransactionFilter)).length;

    const AnnouncementFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const AnnouncementCnt =  (await AnnouncementDb.destroy(AnnouncementFilter)).length;

    const ProcessedFileFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const ProcessedFileCnt =  (await ProcessedFileDb.destroy(ProcessedFileFilter)).length;

    const userFilter = { '$or': [{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userCnt =  (await userDb.destroy(userFilter)).length;

    const userAuthSettingsFilter = { '$or': [{ userId : { '$in' : userIds } },{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userAuthSettingsCnt =  (await userAuthSettingsDb.destroy(userAuthSettingsFilter)).length;

    const userTokensFilter = { '$or': [{ userId : { '$in' : userIds } },{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userTokensCnt =  (await userTokensDb.destroy(userTokensFilter)).length;

    const userRoleFilter = { '$or': [{ userId : { '$in' : userIds } }] };
    const userRoleCnt =  (await userRoleDb.destroy(userRoleFilter)).length;
    let deleted = (await userDb.destroy(filter)).length;
    let result = {
      PaymentTransaction :PaymentTransactionCnt ,
      Announcement :AnnouncementCnt ,
      ProcessedFile :ProcessedFileCnt ,
      user :userCnt + deleted,
      userAuthSettings :userAuthSettingsCnt ,
      userTokens :userTokensCnt ,
      userRole :userRoleCnt ,
    };
    return response.success({
      message: 'No of Dependency deleted',
      data: result
    });
  } else {
    return response.success({
      message: 'No of Dependency deleted',
      data: {  user : 0 }
    });
  }
};

const softDeleteWithDependency = ({
  userDb,PaymentTransactionDb,AnnouncementDb,ProcessedFileDb,userAuthSettingsDb,userTokensDb,userRoleDb
}) => async (filter,updateBody) =>{
  let user = await userDb.findAll(filter);
  if (user.length){
    let userIds = user.map((obj) => obj.id);

    const PaymentTransactionFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const PaymentTransactionCnt =  (await PaymentTransactionDb.update(PaymentTransactionFilter,updateBody)).length;

    const AnnouncementFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const AnnouncementCnt =  (await AnnouncementDb.update(AnnouncementFilter,updateBody)).length;

    const ProcessedFileFilter = { '$or': [{ user_id : { '$in' : userIds } }] };
    const ProcessedFileCnt =  (await ProcessedFileDb.update(ProcessedFileFilter,updateBody)).length;

    const userFilter = { '$or': [{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userCnt =  (await userDb.update(userFilter,updateBody)).length;

    const userAuthSettingsFilter = { '$or': [{ userId : { '$in' : userIds } },{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userAuthSettingsCnt =  (await userAuthSettingsDb.update(userAuthSettingsFilter,updateBody)).length;

    const userTokensFilter = { '$or': [{ userId : { '$in' : userIds } },{ addedBy : { '$in' : userIds } },{ updatedBy : { '$in' : userIds } }] };
    const userTokensCnt =  (await userTokensDb.update(userTokensFilter,updateBody)).length;

    const userRoleFilter = { '$or': [{ userId : { '$in' : userIds } }] };
    const userRoleCnt =  (await userRoleDb.update(userRoleFilter,updateBody)).length;
    let updated = (await userDb.update(filter,updateBody)).length;
    let result = {
      PaymentTransaction :PaymentTransactionCnt ,
      Announcement :AnnouncementCnt ,
      ProcessedFile :ProcessedFileCnt ,
      user :userCnt + updated,
      userAuthSettings :userAuthSettingsCnt ,
      userTokens :userTokensCnt ,
      userRole :userRoleCnt ,
    };
    return response.success({
      message: 'No of Dependency deleted',
      data: result
    });
  } else {
    return response.success({
      message: 'No of Dependency deleted',
      data: {  user : 0 }
    });
  }
};
module.exports = {
  getDependencyCount,
  deleteWithDependency,
  softDeleteWithDependency
};
