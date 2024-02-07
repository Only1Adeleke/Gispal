const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const VideoSource = sequelize.define('VideoSource',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    name:{ type:DataTypes.INTEGER },
    source_url:{ type:DataTypes.STRING }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (VideoSource,options){
          VideoSource.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (VideoSource,options){
          if (VideoSource !== undefined && VideoSource.length) { 
            for (let index = 0; index < VideoSource.length; index++) { 
        
              const element = VideoSource[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  VideoSource.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(VideoSource);
  sequelizePaginate.paginate(VideoSource);
  return VideoSource;
}
module.exports = makeModel;