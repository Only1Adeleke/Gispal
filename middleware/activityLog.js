/**
 * activityLog.js
 * @description :: middleware used in logging activity of API calls
 */

const activityLogDb = require('../data-access/activityLogDb');

module.exports = {
  addActivityLog: async function (req,res,next){ 
    try {
      res.on('finish',async ()=>{
        let url = req.url;
        let routes = url.split('/');
        module = routes[1];
        let referenceId = '';
        let method = req.method;
        let action = getAction(url,req.method);
        if (req.params){
          referenceId = req.params.id || '';
        }
        let activityLog = {
          details: {
            body:{ ...req.body } || {},
            params:{ ...req.params } || {}
          },
          route: req.originalUrl,
          module,
          referenceId,
          userId: req.user ? req.user.id : null,
          action,
          method
        };
        await activityLogDb.createOne(activityLog);
        console.log('activity log added');
      });
      next();
    }
    catch (error){
      next();
    }
  }
};

function getAction (url,method){
  url = url.toLowerCase();
  let action;
  if (method === 'GET'){
    action = 'read';
  }
  else if (url.includes('delete')){
    action = 'delete';
  }
  else if (url.includes('create') || url.includes('addBulk')){
    action = 'create';
  } 
  else if (url.includes('update')) {
    action = 'update';
  }
  else if (url.includes('log') || url.includes('register') || url.includes('pass')){
    action = 'authentication';
  } else {
    action = 'custom';
  };
  
  return action;
}
