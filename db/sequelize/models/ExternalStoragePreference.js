const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const ExternalStoragePreference = sequelize.define('ExternalStoragePreference',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    user_id:{ type:DataTypes.INTEGER },
    storage_location:{ type:DataTypes.ENUM }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (ExternalStoragePreference,options){
          ExternalStoragePreference.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (ExternalStoragePreference,options){
          if (ExternalStoragePreference !== undefined && ExternalStoragePreference.length) { 
            for (let index = 0; index < ExternalStoragePreference.length; index++) { 
        
              const element = ExternalStoragePreference[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  ExternalStoragePreference.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(ExternalStoragePreference);
  sequelizePaginate.paginate(ExternalStoragePreference);
  return ExternalStoragePreference;
}
module.exports = makeModel;