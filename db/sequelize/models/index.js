const dbConnection = require('../dbConnection');
const db = {};
db.sequelize = dbConnection;

db.VideoSource = require('./VideoSource')(dbConnection);

db.MusicSource = require('./MusicSource')(dbConnection);

db.Notification = require('./Notification')(dbConnection);

db.PaymentTransaction = require('./PaymentTransaction')(dbConnection);

db.ExternalStoragePreference = require('./ExternalStoragePreference')(dbConnection);

db.Announcement = require('./Announcement')(dbConnection);

db.ProcessedFile = require('./ProcessedFile')(dbConnection);

db.SubscriptionPlan = require('./SubscriptionPlan')(dbConnection);

db.user = require('./user')(dbConnection);

db.userAuthSettings = require('./userAuthSettings')(dbConnection);

db.userTokens = require('./userTokens')(dbConnection);

db.pushNotification = require('./pushNotification')(dbConnection);

db.activityLog = require('./activityLog')(dbConnection);

db.role = require('./role')(dbConnection);

db.projectRoute = require('./projectRoute')(dbConnection);

db.routeRole = require('./routeRole')(dbConnection);

db.userRole = require('./userRole')(dbConnection);

db.user.belongsTo(db.SubscriptionPlan, {
  foreignKey: 'subscription_plan_id',
  as: '_subscription_plan_id',
  targetKey: 'id' 
});
db.SubscriptionPlan.hasOne(db.user, {
  foreignKey: 'subscription_plan_id',
  sourceKey: 'id' 
});
db.PaymentTransaction.belongsTo(db.user, {
  foreignKey: 'user_id',
  as: '_user_id',
  targetKey: 'id' 
});
db.user.hasOne(db.PaymentTransaction, {
  foreignKey: 'user_id',
  sourceKey: 'id' 
});
db.Announcement.belongsTo(db.user, {
  foreignKey: 'user_id',
  as: '_user_id',
  targetKey: 'id' 
});
db.user.hasMany(db.Announcement, {
  foreignKey: 'user_id',
  sourceKey: 'id' 
});
db.ProcessedFile.belongsTo(db.user, {
  foreignKey: 'user_id',
  as: '_user_id',
  targetKey: 'id' 
});
db.user.hasMany(db.ProcessedFile, {
  foreignKey: 'user_id',
  sourceKey: 'id' 
});
db.user.belongsTo(db.user, {
  foreignKey: 'addedBy',
  as: '_addedBy',
  targetKey: 'id' 
});
db.user.hasMany(db.user, {
  foreignKey: 'addedBy',
  sourceKey: 'id' 
});
db.user.belongsTo(db.user, {
  foreignKey: 'updatedBy',
  as: '_updatedBy',
  targetKey: 'id' 
});
db.user.hasMany(db.user, {
  foreignKey: 'updatedBy',
  sourceKey: 'id' 
});
db.userAuthSettings.belongsTo(db.user, {
  foreignKey: 'userId',
  as: '_userId',
  targetKey: 'id' 
});
db.user.hasMany(db.userAuthSettings, {
  foreignKey: 'userId',
  sourceKey: 'id' 
});
db.userAuthSettings.belongsTo(db.user, {
  foreignKey: 'addedBy',
  as: '_addedBy',
  targetKey: 'id' 
});
db.user.hasMany(db.userAuthSettings, {
  foreignKey: 'addedBy',
  sourceKey: 'id' 
});
db.userAuthSettings.belongsTo(db.user, {
  foreignKey: 'updatedBy',
  as: '_updatedBy',
  targetKey: 'id' 
});
db.user.hasMany(db.userAuthSettings, {
  foreignKey: 'updatedBy',
  sourceKey: 'id' 
});
db.userTokens.belongsTo(db.user, {
  foreignKey: 'userId',
  as: '_userId',
  targetKey: 'id' 
});
db.user.hasMany(db.userTokens, {
  foreignKey: 'userId',
  sourceKey: 'id' 
});
db.userTokens.belongsTo(db.user, {
  foreignKey: 'addedBy',
  as: '_addedBy',
  targetKey: 'id' 
});
db.user.hasMany(db.userTokens, {
  foreignKey: 'addedBy',
  sourceKey: 'id' 
});
db.userTokens.belongsTo(db.user, {
  foreignKey: 'updatedBy',
  as: '_updatedBy',
  targetKey: 'id' 
});
db.user.hasMany(db.userTokens, {
  foreignKey: 'updatedBy',
  sourceKey: 'id' 
});
db.userRole.belongsTo(db.user, {
  foreignKey: 'userId',
  as: '_userId',
  targetKey: 'id' 
});
db.user.hasMany(db.userRole, {
  foreignKey: 'userId',
  sourceKey: 'id' 
});
db.routeRole.belongsTo(db.role, {
  foreignKey: 'roleId',
  as: '_roleId',
  targetKey: 'id' 
});
db.role.hasMany(db.routeRole, {
  foreignKey: 'roleId',
  sourceKey: 'id' 
});
db.userRole.belongsTo(db.role, {
  foreignKey: 'roleId',
  as: '_roleId',
  targetKey: 'id' 
});
db.role.hasMany(db.userRole, {
  foreignKey: 'roleId',
  sourceKey: 'id' 
});
db.routeRole.belongsTo(db.projectRoute, {
  foreignKey: 'routeId',
  as: '_routeId',
  targetKey: 'id' 
});
db.projectRoute.hasMany(db.routeRole, {
  foreignKey: 'routeId',
  sourceKey: 'id' 
});

module.exports = db;