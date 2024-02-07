module.exports = (PaymentTransaction) => {

  let newPaymentTransaction = { 
    id: PaymentTransaction.id,
    isDeleted: PaymentTransaction.isDeleted,
    user_id: PaymentTransaction.user_id,
    amount: PaymentTransaction.amount,
    status: PaymentTransaction.status,
    payment_gateway: PaymentTransaction.payment_gateway,
    transaction_date: PaymentTransaction.transaction_date,
  };

  // remove undefined values
  if (newPaymentTransaction.id){
    Object.keys(newPaymentTransaction).forEach(key =>{
      if (newPaymentTransaction[key] === undefined) return newPaymentTransaction[key] = null;
    });
  } else {
    Object.keys(newPaymentTransaction).forEach(key => newPaymentTransaction[key] === undefined && delete newPaymentTransaction[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newPaymentTransaction) => {
   *   if (!newPaymentTransaction.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newPaymentTransaction) 
   */
  return Object.freeze(newPaymentTransaction);
};
