const response = require('../../../../utils/response'); 
const responseHandler = require('../../../../utils/response/responseHandler'); 
const getSelectObject = require('../../../../utils/getSelectObject'); 

const changePassword = (changePasswordUsecase) => async (req,res) => {
  try {
    let params = {
      ...req.body,
      userId: req.user.id
    };
    let result = await changePasswordUsecase(params);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};  

const updateProfile = (updateProfileUsecase) => async (req,res) => {
  try {
    let result = await updateProfileUsecase({
      data:req.body,
      id:req.user.id
    },req,res);
    return responseHandler(res,result);
  } catch (error){
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

const getLoggedInUserInfo = (getUserUsecase) => async (req,res) =>{
  try {
    const options = {};
    const query = {
      id : req.user.id,
      isDeleted: false,
    };
    let result = await getUserUsecase({
      query,
      options 
    },req,res);
    return responseHandler(res,result);
  } catch (error) {
    return responseHandler(res,response.internalServerError({ message:error.message }));
  }
};

module.exports = {
  changePassword,
  updateProfile,
  getLoggedInUserInfo
};
