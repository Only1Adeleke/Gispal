const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const Announcement = sequelize.define('Announcement',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    title:{ type:DataTypes.STRING },
    content:{ type:DataTypes.TEXT },
    user_id:{ type:DataTypes.INTEGER },
    created_at:{ type:DataTypes.DATE }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (Announcement,options){
          Announcement.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (Announcement,options){
          if (Announcement !== undefined && Announcement.length) { 
            for (let index = 0; index < Announcement.length; index++) { 
        
              const element = Announcement[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  Announcement.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(Announcement);
  sequelizePaginate.paginate(Announcement);
  return Announcement;
}
module.exports = makeModel;