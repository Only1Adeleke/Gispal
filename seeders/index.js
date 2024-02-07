const bcrypt = require('bcrypt'); 
const userDbService = require('../data-access/userDb');
const authConstant = require('../constants/authConstant');
const userRoleDbService = require('../data-access/userRoleDb');
const routeRoleDbService = require('../data-access/routeRoleDb');
const projectRouteDbService = require('../data-access/projectRouteDb');
const roleDbService = require('../data-access/roleDb');
const replaceAll = require('../utils/replaceAll');
async function seedUser () {
  try {
    let userToBeInserted = {};
    userToBeInserted = await userDbService.findOne({ 'username':'Philip.Gleichner' });
    if (!userToBeInserted) {  
      userToBeInserted = {
        'password':'XTmzyMQxd3SMAnG',
        'isDeleted':false,
        'username':'Philip.Gleichner',
        'email':'Lucinda.Von40@hotmail.com',
        'userType':authConstant.USER_TYPES.User
      };
      await userDbService.createOne(userToBeInserted);
    } else {
      userToBeInserted = {
        'password':'XTmzyMQxd3SMAnG',
        'isDeleted':false,
        'username':'Philip.Gleichner',
        'email':'Lucinda.Von40@hotmail.com',
        'userType':authConstant.USER_TYPES.User
      };
      userToBeInserted.password = await bcrypt.hash(userToBeInserted.password, 8);
      await userDbService.update({ 'username':'Philip.Gleichner' }, userToBeInserted);
    }
    userToBeInserted = await userDbService.findOne({ 'username':'Dana.Jakubowski20' });
    if (!userToBeInserted) {  
      userToBeInserted = {
        'password':'sV0zDFCOhgli6FI',
        'isDeleted':false,
        'username':'Dana.Jakubowski20',
        'email':'Nicola_Haley28@hotmail.com',
        'userType':authConstant.USER_TYPES.Admin
      };
      await userDbService.createOne(userToBeInserted);
    } else {
      userToBeInserted = {
        'password':'sV0zDFCOhgli6FI',
        'isDeleted':false,
        'username':'Dana.Jakubowski20',
        'email':'Nicola_Haley28@hotmail.com',
        'userType':authConstant.USER_TYPES.Admin
      };
      userToBeInserted.password = await bcrypt.hash(userToBeInserted.password, 8);
      await userDbService.update({ 'username':'Dana.Jakubowski20' }, userToBeInserted);
    }
    console.info('User model seeded 🍺');
  } catch (error){
    console.log('User seeder failed due to ', error.message);
  }   
}

async function seedRole () {
  try {
    const roles = [ 'Admin', 'System_User', 'User' ];
    const insertedRoles = await roleDbService.findAll({ code: { '$in': roles.map(role => role.toUpperCase()) } });
    const rolesToInsert = [];
    roles.forEach(role => {
      if (!insertedRoles.find(insertedRole => insertedRole.code === role.toUpperCase())) {
        rolesToInsert.push({
          name: role,
          code: role.toUpperCase(),
          weight: 1
        });
      }
    });
    if (rolesToInsert.length) {
      const result = await roleDbService.createMany(rolesToInsert);
      if (result) console.log('Role seeded 🍺');
      else console.log('Role seeder failed!');
    } else {
      console.log('Role is upto date 🍺');
    }
  } catch (error) {
    console.log('Role seeder failed due to ', error.message);
  }
}
  
async function seedProjectRoutes (routes) {
  try {
    if (routes) {
      let routeName = '';
      const dbRoutes = await projectRouteDbService.findAll({});
      let routeArr = [];
      let routeObj = {};
      routes.forEach(route => {
        routeName = `${replaceAll((route.path).toLowerCase(), '/', '_')}`;
        route.methods.forEach(method => {
          routeObj = dbRoutes.find(dbRoute => dbRoute.route_name === routeName && dbRoute.method === method);
          if (!routeObj) {
            routeArr.push({
              'uri': route.path.toLowerCase(),
              'method': method,
              'route_name': routeName,
            });
          }
        });
      });
      if (routeArr.length) {
        const result = await projectRouteDbService.createMany(routeArr);
        if (result) console.info('ProjectRoute model seeded 🍺');
        else console.info('ProjectRoute seeder failed.');
      } else {
        console.info('ProjectRoute is upto date 🍺');
      }
    }
  } catch (error) {
    console.log('ProjectRoute seeder failed due to ', error.message);
  }
}

async function seedRouteRole () {
  try {
    const routeRoles = [ 
      {
        route: '/admin/announcement/create',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/announcement/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/announcement/addbulk',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/announcement/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/announcement/list',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/announcement/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/announcement/:id',
        role: 'Admin',
        method: 'GET' 
      },
      {
        route: '/admin/announcement/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/announcement/count',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/announcement/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/announcement/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/announcement/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/admin/announcement/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/announcement/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/announcement/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/create',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/processedfile/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/list',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/processedfile/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/:id',
        role: 'Admin',
        method: 'GET' 
      },
      {
        route: '/admin/processedfile/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/processedfile/count',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/processedfile/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/processedfile/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/admin/processedfile/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/processedfile/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/processedfile/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/:id',
        role: 'Admin',
        method: 'GET' 
      },
      {
        route: '/admin/subscriptionplan/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/subscriptionplan/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/subscriptionplan/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/admin/subscriptionplan/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/subscriptionplan/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/subscriptionplan/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/user/create',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/user/create',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/admin/user/create',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/user/addbulk',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/user/addbulk',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/admin/user/addbulk',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/user/list',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/user/list',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/admin/user/list',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/user/:id',
        role: 'Admin',
        method: 'GET' 
      },
      {
        route: '/admin/user/:id',
        role: 'User',
        method: 'GET' 
      },
      {
        route: '/admin/user/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/user/count',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/user/count',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/admin/user/count',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/user/update/:id',
        role: 'Admin',
        method: 'PUT' 
      },
      {
        route: '/admin/user/update/:id',
        role: 'User',
        method: 'PUT' 
      },
      {
        route: '/admin/user/update/:id',
        role: 'System_User',
        method: 'PUT' 
      },
      {
        route: '/admin/user/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/user/partial-update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/admin/user/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/updatebulk',
        role: 'Admin',
        method: 'PUT' 
      },
      {
        route: '/admin/user/updatebulk',
        role: 'User',
        method: 'PUT' 
      },
      {
        route: '/admin/user/updatebulk',
        role: 'System_User',
        method: 'PUT' 
      },
      {
        route: '/admin/user/softdelete/:id',
        role: 'Admin',
        method: 'PUT' 
      },
      {
        route: '/admin/user/softdelete/:id',
        role: 'User',
        method: 'PUT' 
      },
      {
        route: '/admin/user/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdeletemany',
        role: 'Admin',
        method: 'PUT' 
      },
      {
        route: '/admin/user/softdeletemany',
        role: 'User',
        method: 'PUT' 
      },
      {
        route: '/admin/user/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/delete/:id',
        role: 'Admin',
        method: 'DELETE' 
      },
      {
        route: '/admin/user/delete/:id',
        role: 'User',
        method: 'DELETE' 
      },
      {
        route: '/admin/user/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/user/deletemany',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/admin/user/deletemany',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/admin/user/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/videosource/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/videosource/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/videosource/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/videosource/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/videosource/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/videosource/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/videosource/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/videosource/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/videosource/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/videosource/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/videosource/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/videosource/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/musicsource/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/musicsource/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/musicsource/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/musicsource/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/musicsource/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/musicsource/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/musicsource/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/musicsource/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/musicsource/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/musicsource/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/musicsource/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/musicsource/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/notification/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/notification/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/notification/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/notification/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/notification/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/notification/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/notification/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/notification/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/notification/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/notification/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/notification/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/notification/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/paymenttransaction/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/paymenttransaction/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/paymenttransaction/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/paymenttransaction/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/paymenttransaction/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/paymenttransaction/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/paymenttransaction/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/paymenttransaction/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/paymenttransaction/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/paymenttransaction/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/paymenttransaction/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/paymenttransaction/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/externalstoragepreference/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/externalstoragepreference/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/externalstoragepreference/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/externalstoragepreference/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/externalstoragepreference/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/externalstoragepreference/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/externalstoragepreference/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/externalstoragepreference/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/externalstoragepreference/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/externalstoragepreference/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/externalstoragepreference/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/externalstoragepreference/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/userauthsettings/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/userauthsettings/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/usertokens/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/usertokens/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/pushnotification/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/pushnotification/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/pushnotification/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/pushnotification/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/pushnotification/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/pushnotification/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/pushnotification/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/pushnotification/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/pushnotification/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/pushnotification/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/pushnotification/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/pushnotification/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/activitylog/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/activitylog/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/activitylog/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/activitylog/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/activitylog/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/activitylog/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/activitylog/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/activitylog/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/activitylog/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/activitylog/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/activitylog/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/activitylog/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/role/create',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/role/addbulk',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/role/list',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/role/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/role/count',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/role/update/:id',
        role: 'System_User',
        method: 'PUT' 
      },
      {
        route: '/admin/role/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/updatebulk',
        role: 'System_User',
        method: 'PUT' 
      },
      {
        route: '/admin/role/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/role/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/projectroute/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/projectroute/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/list',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/routerole/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/routerole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/routerole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/list',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/userrole/:id',
        role: 'System_User',
        method: 'GET' 
      },
      {
        route: '/admin/userrole/count',
        role: 'System_User',
        method: 'POST' 
      },
      {
        route: '/admin/userrole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/userrole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/device/api/v1/announcement/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/announcement/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/announcement/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/announcement/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/announcement/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/announcement/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/device/api/v1/processedfile/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/processedfile/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/processedfile/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/processedfile/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/processedfile/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/processedfile/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/device/api/v1/subscriptionplan/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/subscriptionplan/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/subscriptionplan/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/subscriptionplan/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/subscriptionplan/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/subscriptionplan/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/create',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/create',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/addbulk',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/addbulk',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/list',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/list',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/:id',
        role: 'Admin',
        method: 'GET' 
      },
      {
        route: '/device/api/v1/user/:id',
        role: 'User',
        method: 'GET' 
      },
      {
        route: '/device/api/v1/user/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/user/count',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/count',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/device/api/v1/user/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/partial-update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/updatebulk',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdelete/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdeletemany',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/user/delete/:id',
        role: 'User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/user/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/user/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/deletemany',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/videosource/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/videosource/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/videosource/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/videosource/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/videosource/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/videosource/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/videosource/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/videosource/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/videosource/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/videosource/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/videosource/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/videosource/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/musicsource/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/musicsource/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/musicsource/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/musicsource/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/musicsource/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/musicsource/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/musicsource/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/musicsource/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/musicsource/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/musicsource/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/musicsource/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/musicsource/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/notification/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/notification/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/notification/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/notification/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/notification/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/notification/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/notification/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/notification/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/notification/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/notification/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/notification/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/notification/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/paymenttransaction/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/paymenttransaction/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/paymenttransaction/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/paymenttransaction/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/paymenttransaction/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/paymenttransaction/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/paymenttransaction/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/paymenttransaction/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/paymenttransaction/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/paymenttransaction/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/paymenttransaction/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/paymenttransaction/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/externalstoragepreference/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/externalstoragepreference/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/externalstoragepreference/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/externalstoragepreference/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/externalstoragepreference/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/externalstoragepreference/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/externalstoragepreference/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/externalstoragepreference/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/externalstoragepreference/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/externalstoragepreference/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/externalstoragepreference/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/externalstoragepreference/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/userauthsettings/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/userauthsettings/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/usertokens/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/usertokens/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/pushnotification/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/pushnotification/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/pushnotification/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/pushnotification/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/pushnotification/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/pushnotification/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/pushnotification/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/pushnotification/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/pushnotification/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/pushnotification/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/pushnotification/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/pushnotification/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/activitylog/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/activitylog/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/activitylog/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/activitylog/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/activitylog/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/activitylog/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/activitylog/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/activitylog/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/activitylog/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/activitylog/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/activitylog/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/activitylog/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/role/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/role/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/projectroute/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/projectroute/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/routerole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/routerole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/userrole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/userrole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/client/api/v1/announcement/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/announcement/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/announcement/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/announcement/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/announcement/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/announcement/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/client/api/v1/processedfile/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/processedfile/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/processedfile/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/processedfile/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/processedfile/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/processedfile/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/client/api/v1/subscriptionplan/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/subscriptionplan/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/subscriptionplan/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/subscriptionplan/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/subscriptionplan/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/subscriptionplan/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/create',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/create',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/addbulk',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/addbulk',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/list',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/list',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/:id',
        role: 'Admin',
        method: 'GET' 
      },
      {
        route: '/client/api/v1/user/:id',
        role: 'User',
        method: 'GET' 
      },
      {
        route: '/client/api/v1/user/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/user/count',
        role: 'Admin',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/count',
        role: 'User',
        method: 'POST' 
      },
      {
        route: '/client/api/v1/user/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/partial-update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/updatebulk',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/softdelete/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/softdeletemany',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/user/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/user/delete/:id',
        role: 'User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/user/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/user/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/deletemany',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/user/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/videosource/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/videosource/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/videosource/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/videosource/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/videosource/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/videosource/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/videosource/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/videosource/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/videosource/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/videosource/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/videosource/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/videosource/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/musicsource/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/musicsource/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/musicsource/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/musicsource/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/musicsource/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/musicsource/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/musicsource/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/musicsource/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/musicsource/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/musicsource/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/musicsource/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/musicsource/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/notification/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/notification/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/notification/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/notification/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/notification/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/notification/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/notification/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/notification/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/notification/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/notification/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/notification/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/notification/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/paymenttransaction/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/paymenttransaction/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/paymenttransaction/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/paymenttransaction/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/paymenttransaction/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/paymenttransaction/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/paymenttransaction/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/paymenttransaction/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/paymenttransaction/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/paymenttransaction/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/paymenttransaction/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/paymenttransaction/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/externalstoragepreference/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/externalstoragepreference/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/externalstoragepreference/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/externalstoragepreference/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/externalstoragepreference/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/externalstoragepreference/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/externalstoragepreference/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/externalstoragepreference/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/externalstoragepreference/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/externalstoragepreference/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/externalstoragepreference/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/externalstoragepreference/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userauthsettings/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userauthsettings/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userauthsettings/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userauthsettings/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/userauthsettings/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userauthsettings/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userauthsettings/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userauthsettings/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userauthsettings/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userauthsettings/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userauthsettings/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/userauthsettings/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/usertokens/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/usertokens/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/usertokens/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/usertokens/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/usertokens/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/usertokens/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/usertokens/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/usertokens/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/usertokens/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/usertokens/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/usertokens/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/usertokens/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/pushnotification/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/pushnotification/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/pushnotification/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/pushnotification/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/pushnotification/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/pushnotification/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/pushnotification/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/pushnotification/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/pushnotification/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/pushnotification/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/pushnotification/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/pushnotification/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/activitylog/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/activitylog/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/activitylog/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/activitylog/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/activitylog/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/activitylog/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/activitylog/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/activitylog/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/activitylog/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/activitylog/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/activitylog/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/activitylog/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/role/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/role/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/role/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/role/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/role/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/role/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/role/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/role/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/role/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/role/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/role/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/role/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/projectroute/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/projectroute/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/projectroute/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/projectroute/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/projectroute/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/projectroute/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/projectroute/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/projectroute/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/projectroute/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/projectroute/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/projectroute/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/projectroute/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/routerole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/routerole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/routerole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/routerole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/routerole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/routerole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/routerole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/routerole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/routerole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/routerole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/routerole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/routerole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userrole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userrole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userrole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userrole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/client/api/v1/userrole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/client/api/v1/userrole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userrole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userrole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userrole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userrole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/client/api/v1/userrole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/client/api/v1/userrole/deletemany',
        role: 'System_User',
        method: 'POST'
      },

    ];
    if (routeRoles && routeRoles.length) {
      const routes = [...new Set(routeRoles.map(routeRole => routeRole.route.toLowerCase()))];
      const routeMethods = [...new Set(routeRoles.map(routeRole => routeRole.method))];
      const roles = [ 'Admin', 'System_User', 'User' ];
      const insertedProjectRoute = await projectRouteDbService.findAll({
        uri: { '$in': routes },
        method: { '$in': routeMethods },
        'isActive': true,
        'isDeleted': false
      });
      const insertedRoles = await roleDbService.findAll({
        code: { '$in': roles.map(role => role.toUpperCase()) },
        'isActive': true,
        'isDeleted': false
      });
      let projectRouteId = '';
      let roleId = '';
      let createRouteRoles = routeRoles.map(routeRole => {
        projectRouteId = insertedProjectRoute.find(pr => pr.uri === routeRole.route.toLowerCase() && pr.method === routeRole.method);
        roleId = insertedRoles.find(r => r.code === routeRole.role.toUpperCase());
        if (projectRouteId && roleId) {
          return {
            roleId: roleId.id,
            routeId: projectRouteId.id
          };
        }
      });
      createRouteRoles = createRouteRoles.filter(Boolean);
      const routeRolesToBeInserted = [];
      let routeRoleObj = {};
    
      await Promise.all(
        createRouteRoles.map(async routeRole => {
          routeRoleObj = await routeRoleDbService.findOne({
            routeId: routeRole.routeId,
            roleId: routeRole.roleId,
          });
          if (!routeRoleObj) {
            routeRolesToBeInserted.push({
              routeId: routeRole.routeId,
              roleId: routeRole.roleId,
            });
          }
        })
      );
      if (routeRolesToBeInserted.length) {
        const result = await routeRoleDbService.createMany(routeRolesToBeInserted);
        if (result) console.log('RouteRole seeded 🍺');
        else console.log('RouteRole seeder failed!');
      } else {
        console.log('RouteRole is upto date 🍺');
      }
    }
  } catch (error){
    console.log('RouteRole seeder failed due to ', error.message);
  }
}
  
async function seedUserRole (){
  try {
    const userRoles = [{
      'username':'Philip.Gleichner',
      'password':'XTmzyMQxd3SMAnG'
    },{
      'username':'Dana.Jakubowski20',
      'password':'sV0zDFCOhgli6FI'
    }];
    const defaultRoles = await roleDbService.findAll();
    const insertedUsers = await userDbService.findAll({ username: { '$in': userRoles.map(userRole => userRole.username) } });
    let user = {};
    const userRolesArr = [];
    userRoles.map(userRole => {
      user = insertedUsers.find(user => user.username === userRole.username && user.isPasswordMatch(userRole.password) && !user.isDeleted);
      if (user) {
        if (user.userType === authConstant.USER_TYPES.Admin){
          userRolesArr.push({
            userId: user.id,
            roleId: defaultRoles.find((d)=>d.code === 'ADMIN').id
          });
        } else if (user.userType === authConstant.USER_TYPES.User){
          userRolesArr.push({
            userId: user.id,
            roleId: defaultRoles.find((d)=>d.code === 'USER').id
          });
        } else {
          userRolesArr.push({
            userId: user.id,
            roleId: defaultRoles.find((d)=>d.code === 'SYSTEM_USER').id
          });
        }  
      }
    });
    let userRoleObj = {};
    const userRolesToBeInserted = [];
    if (userRolesArr.length) {
      await Promise.all(
        userRolesArr.map(async userRole => {
          userRoleObj = await userRoleDbService.findOne({
            userId: userRole.userId,
            roleId: userRole.roleId
          });
          if (!userRoleObj) {
            userRolesToBeInserted.push({
              userId: userRole.userId,
              roleId: userRole.roleId
            });
          }
        })
      );
      if (userRolesToBeInserted.length) {
        const result = await userRoleDbService.createMany(userRolesToBeInserted);
        if (result) console.log('UserRole seeded 🍺');
        else console.log('UserRole seeder failed');
      } else {
        console.log('UserRole is upto date 🍺');
      }
    }
  } catch (error){
    console.log('UserRole seeder failed due to ', error.message);
  }
}

async function seedData (allRegisterRoutes){
  await seedUser();
  await seedRole();
  await seedProjectRoutes(allRegisterRoutes);
  await seedRouteRole();
  await seedUserRole();

};
module.exports = seedData;