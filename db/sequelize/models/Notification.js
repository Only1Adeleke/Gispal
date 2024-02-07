const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const Notification = sequelize.define('Notification',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    user_id:{ type:DataTypes.INTEGER },
    content:{ type:DataTypes.STRING },
    is_read:{ type:DataTypes.BOOLEAN },
    created_at:{ type:DataTypes.DATE }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (Notification,options){
          Notification.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (Notification,options){
          if (Notification !== undefined && Notification.length) { 
            for (let index = 0; index < Notification.length; index++) { 
        
              const element = Notification[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  Notification.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(Notification);
  sequelizePaginate.paginate(Notification);
  return Notification;
}
module.exports = makeModel;