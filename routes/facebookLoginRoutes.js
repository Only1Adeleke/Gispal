const express = require('express');
const router = express.Router();
const passport = require('passport');

const facebookLogin = require('../use-case/authentication/facebookLogin');
const response = require('../utils/response');
const responseHandler = require('../utils/response/responseHandler');

router.get('/auth/facebook/error', (req, res) => {
  responseHandler(res,response.badRequest({ message:'Login Failed' }));
});

router.get('/auth/facebook',passport.authenticate('facebook', {
  scope: ['profile'],
  session:false
}));

router.get('/auth/facebook/callback',
  (req,res,next)=>{
    passport.authenticate('facebook', { failureRedirect: '/auth/facebook/error' }, async (error, user , info) => {
      if (error){
        return responseHandler(res,response.internalServerError({ message:error.message }));
      }
      if (user){
        try {
          let result = await facebookLogin(user.email, req.session.platform);
          return responseHandler(res,result);
        } catch (error) {
          return responseHandler(res,response.internalServerError({ message: error.message }));
        }
      }
    })(req,res,next);
  });

module.exports = router;