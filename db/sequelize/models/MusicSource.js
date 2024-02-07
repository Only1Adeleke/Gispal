const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const MusicSource = sequelize.define('MusicSource',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    name:{ type:DataTypes.STRING },
    source_url:{ type:DataTypes.STRING }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (MusicSource,options){
          MusicSource.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (MusicSource,options){
          if (MusicSource !== undefined && MusicSource.length) { 
            for (let index = 0; index < MusicSource.length; index++) { 
        
              const element = MusicSource[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  MusicSource.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(MusicSource);
  sequelizePaginate.paginate(MusicSource);
  return MusicSource;
}
module.exports = makeModel;