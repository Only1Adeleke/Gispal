const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const ActivityLog = sequelize.define('activityLog',{
    id:{
      type:DataTypes.INTEGER,
      autoIncrement:true,
      primaryKey:true
    },
    body:{ type:DataTypes.STRING },
    params:{ type:DataTypes.STRING },
    route:{ type:DataTypes.STRING },
    module:{ type:DataTypes.STRING },
    action:{ type:DataTypes.STRING },
    referenceId:{ type:DataTypes.STRING },
    loggedInUser:{ type:DataTypes.INTEGER },
    method:{ type:DataTypes.STRING },
    isDeleted:{ type:DataTypes.BOOLEAN }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (activityLog,options){
          activityLog.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (activityLog,options){
          if (activityLog !== undefined && activityLog.length) { 
            for (let index = 0; index < activityLog.length; index++) { 
        
              const element = activityLog[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  ActivityLog.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(ActivityLog);
  sequelizePaginate.paginate(ActivityLog);
  return ActivityLog;
}
module.exports = makeModel;