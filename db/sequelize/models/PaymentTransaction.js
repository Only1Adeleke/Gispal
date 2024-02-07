const {
  DataTypes, Op 
} = require('sequelize'); 
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const  convertObjectToEnum  = require('../../../utils/convertObjectToEnum');
function makeModel (sequelize){
  const PaymentTransaction = sequelize.define('PaymentTransaction',{
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      autoIncrement:true
    },
    isDeleted:{ type:DataTypes.BOOLEAN },
    user_id:{ type:DataTypes.INTEGER },
    amount:{ type:DataTypes.DOUBLE },
    status:{ type:DataTypes.INTEGER },
    payment_gateway:{ type:DataTypes.STRING },
    transaction_date:{ type:DataTypes.DATE }
  }
  ,{
    hooks:{
      beforeCreate: [
        async function (PaymentTransaction,options){
          PaymentTransaction.isDeleted = false;

        },
      ],
      beforeBulkCreate: [
        async function (PaymentTransaction,options){
          if (PaymentTransaction !== undefined && PaymentTransaction.length) { 
            for (let index = 0; index < PaymentTransaction.length; index++) { 
        
              const element = PaymentTransaction[index]; 
              element.isActive = true; 
              element.isDeleted = false; 
  
            } 
          }
        },
      ],
    } 
  }
  );
  PaymentTransaction.prototype.toJSON = function () {
    let values = Object.assign({}, this.get());
    
    return values;
  };
  sequelizeTransforms(PaymentTransaction);
  sequelizePaginate.paginate(PaymentTransaction);
  return PaymentTransaction;
}
module.exports = makeModel;