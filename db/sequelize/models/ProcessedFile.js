const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const ProcessedFile = sequelize.define('ProcessedFile',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    user_id:{ type:DataTypes.INTEGER },
    file_name:{ type:DataTypes.STRING },
    file_type:{ type:DataTypes.STRING },
    file_size:{ type:DataTypes.INTEGER },
    processed_at:{ type:DataTypes.DATE },
    status:{ type:DataTypes.ENUM }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (ProcessedFile,options){
          ProcessedFile.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (ProcessedFile,options){
          if (ProcessedFile !== undefined && ProcessedFile.length) { 
            for (let index = 0; index < ProcessedFile.length; index++) { 
        
              const element = ProcessedFile[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  ProcessedFile.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(ProcessedFile);
  sequelizePaginate.paginate(ProcessedFile);
  return ProcessedFile;
}
module.exports = makeModel;