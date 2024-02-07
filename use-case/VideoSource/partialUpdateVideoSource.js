/**
 *partialUpdateVideoSource.js
 */

const  VideoSourceEntity = require('../../entities/VideoSource');
const response = require('../../utils/response');

/**
 * @description : partially update record with data by id;
 * @param {Object} params : request body.
 * @param {Object} req : The req object represents the HTTP request.
 * @param {Object} res : The res object represents HTTP response.
 * @return {obj} : updated VideoSource. {status, message, data}
 */
const partialUpdateVideoSource = ({ VideoSourceDb }) => async (params,req,res) => {
  let {
    dataToUpdate, query 
  } = params;
  const updatedVideoSource = await VideoSourceDb.update(query,dataToUpdate);
  if (!updatedVideoSource || updatedVideoSource.length == 0){
    return response.recordNotFound();
  }
  return response.success({ data:updatedVideoSource[0] });
};
module.exports = partialUpdateVideoSource;