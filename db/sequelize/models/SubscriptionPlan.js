const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const SubscriptionPlan = sequelize.define('SubscriptionPlan',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true,
      unique:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    name:{ type:DataTypes.STRING },
    price:{ type:DataTypes.DECIMAL },
    features:{ type:DataTypes.JSONB },
    duration_months:{ type:DataTypes.INTEGER }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (SubscriptionPlan,options){
          SubscriptionPlan.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (SubscriptionPlan,options){
          if (SubscriptionPlan !== undefined && SubscriptionPlan.length) { 
            for (let index = 0; index < SubscriptionPlan.length; index++) { 
        
              const element = SubscriptionPlan[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  SubscriptionPlan.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(SubscriptionPlan);
  sequelizePaginate.paginate(SubscriptionPlan);
  return SubscriptionPlan;
}
module.exports = makeModel;