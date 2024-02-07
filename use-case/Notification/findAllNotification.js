/**
 *findAllNotification.js
 */

const response = require('../../utils/response');

/**
 * @description : find all records from database based on query and options.
 * @param {Object} params : request body including option and query.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {Object} : found Notification(s). {status, message, data}
 */
const findAllNotification = ({
  NotificationDb,filterValidation 
}) => async (params,req,res) => {
  let {
    options, query, isCountOnly 
  } = params;
  const validateRequest = await filterValidation(params);
  if (!validateRequest.isValid) {
    return response.validationError({ message: `Invalid values in parameters, ${validateRequest.message}` });
  }
  if (isCountOnly){
    let totalRecords = await NotificationDb.count(query);
    return response.success({ data: { totalRecords } });  
  }
  else {
    let foundNotification = await NotificationDb.paginate(query,options);
    if (!foundNotification){
      return response.recordNotFound();
    }
    return response.success({ data:foundNotification });
  }
};
module.exports = findAllNotification;