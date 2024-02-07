const express = require('express');
const router = express.Router();
const passport = require('passport');

const googleLogin = require('../use-case/authentication/googleLogin');
const response = require('../utils/response');
const responseHandler = require('../utils/response/responseHandler');

router.get('/auth/google/error', (req, res) => {
  responseHandler(res,response.badRequest({ message:'Login Failed' }));
});

router.get('/auth/google',passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session:false 
}));

router.get('/auth/google/callback',
  (req,res,next)=>{
    passport.authenticate('google', { failureRedirect: '/auth/google/error' }, async (error, user , info) => {
      if (error){
        return responseHandler(res,response.internalServerError({ message:error.message }));
      }
      if (user){
        try {
          let result = await googleLogin(user.email, req.session.platform);
          return responseHandler(res,result);
        } catch (error) {
          return responseHandler(res,response.internalServerError({ message: error.message }));
        }
      }
    })(req,res,next);
  }); 

module.exports = router;