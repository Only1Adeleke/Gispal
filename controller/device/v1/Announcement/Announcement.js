const response = require('../../../../utils/response'); 
const responseHandler = require('../../../../utils/response/responseHandler'); 
const getSelectObject = require('../../../../utils/getSelectObject'); 

const addAnnouncement = (addAnnouncementUsecase) => async (req,res) => {
  try {
    let dataToCreate = { ...req.body || {} };
    let result = await addAnnouncementUsecase(dataToCreate,req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const bulkInsertAnnouncement = (bulkInsertAnnouncementUsecase)=> async (req,res) => {
  try {
    let dataToCreate = req.body.data;
    let result = await bulkInsertAnnouncementUsecase(dataToCreate,req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const findAllAnnouncement = (findAllAnnouncementUsecase) => async (req,res) => {
  try {
    let query = { ...req.body.query || {} };
    let options = { ...req.body.options || {} };
    let result = await findAllAnnouncementUsecase({
      query,
      options,
      isCountOnly:req.body.isCountOnly || false
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const getAnnouncement = (getAnnouncementUsecase) => async (req,res) =>{
  try {
    if (!req.params.id){
      return responseHandler(res,response.badRequest());
    }
    let options = {};
    let query = { id: req.params.id };
    let result = await getAnnouncementUsecase({
      query,
      options
    },req,res);
    return responseHandler(res,result);
  } catch (error) {
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const getAnnouncementCount = (getAnnouncementCountUsecase) => async (req,res) => {
  try {
    let where = { ...req.body.where || {} };
    let result = await getAnnouncementCountUsecase({ where },req,res);  
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const updateAnnouncement = (updateAnnouncementUsecase) => async (req,res) =>{
  try {
    if (!req.params.id){
      return responseHandler(res,response.badRequest({ message : 'Insufficient request parameters! id is required.' }));
    }
    let dataToUpdate = { ...req.body || {} };
    let query = { id: req.params.id };
    let result = await updateAnnouncementUsecase({
      dataToUpdate,
      query
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const bulkUpdateAnnouncement = (bulkUpdateAnnouncementUsecase) => async (req,res) => {
  try {
    let dataToUpdate = { ...req.body.data || {} };
    let query = { ...req.body.filter || {} };
    let result = await bulkUpdateAnnouncementUsecase({
      dataToUpdate,
      query
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const partialUpdateAnnouncement = (partialUpdateAnnouncementUsecase) => async (req,res) => {
  try {
    if (!req.params.id){
      return responseHandler(res,response.badRequest({ message : 'Insufficient request parameters! id is required.' }));
    }
    let query = { id: req.params.id };
    let dataToUpdate = req.body;
    let result = await partialUpdateAnnouncementUsecase({
      dataToUpdate,
      query
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const softDeleteAnnouncement = (softDeleteAnnouncementUsecase) => async (req,res)=>{
  try {
    if (!req.params.id){
      return responseHandler(res,response.badRequest({ message : 'Insufficient request parameters! id is required.' }));
    }
    let query = { id: req.params.id };
    const dataToUpdate = { isDeleted: true, };
    let result = await softDeleteAnnouncementUsecase({
      dataToUpdate,
      query
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const deleteAnnouncement = (deleteAnnouncementUsecase) => async (req,res) => {
  try {
    if (!req.params.id){
      return responseHandler(res,response.badRequest({ message : 'Insufficient request parameters! id is required.' }));
    }
    let query = { id: req.params.id };
    let result = await deleteAnnouncementUsecase({ query },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const deleteManyAnnouncement = (deleteManyAnnouncementUsecase) => async (req,res) => {
  try {
    if (!req.body || !req.body.ids){
      return responseHandler(res,response.badRequest({ message : 'Insufficient request parameters! ids field is required.' }));
    }
    let ids = req.body.ids;
    let query = { id : { $in:ids } };
    let result = await deleteManyAnnouncementUsecase(query,req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const softDeleteManyAnnouncement = (softDeleteManyAnnouncementUsecase) => async (req,res) => {
  try {
    if (!req.body || !req.body.ids){
      return responseHandler(res,response.badRequest({ message : 'Insufficient request parameters! ids field is required.' }));
    }
    let ids = req.body.ids;
    let query = { id : { $in:ids } };
    const dataToUpdate = { isDeleted: true, };
    let result = await softDeleteManyAnnouncementUsecase({
      dataToUpdate,
      query
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

module.exports = {
  addAnnouncement,
  bulkInsertAnnouncement,
  findAllAnnouncement,
  getAnnouncement,
  getAnnouncementCount,
  updateAnnouncement,
  bulkUpdateAnnouncement,
  partialUpdateAnnouncement,
  softDeleteAnnouncement,
  deleteAnnouncement,
  deleteManyAnnouncement,
  softDeleteManyAnnouncement
};
