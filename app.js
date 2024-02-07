const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const postmanToOpenApi = require('postman-to-openapi');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
dotenv.config();
global.__basedir = __dirname;
const listEndpoints = require('express-list-endpoints');
const passport = require('passport');
const seeder = require('./seeders');

//all routes
const routes =  require('./routes');
let logger = require('morgan');

const models = require('./db/sequelize/models');
const { devicePassportStrategy } = require('./middleware');
const { clientPassportStrategy } = require('./middleware');
const { adminPassportStrategy } = require('./middleware');
const { googlePassportStrategy } = require('./middleware');
const { facebookPassportStrategy } = require('./middleware');

const app = express();
 
const httpServer = require('http').createServer(app);
const corsOptions = { origin: process.env.ALLOW_ORIGIN, };
app.use(cors(corsOptions));

//template engine
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

devicePassportStrategy(passport);
clientPassportStrategy(passport);
adminPassportStrategy(passport);
googlePassportStrategy(passport);
facebookPassportStrategy(passport);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(session({
  secret:'my-secret',
  resave:true,
  saveUninitialized:false
}));

app.use(require('./middleware/activityLog').addActivityLog);
app.get('/', (req, res) => {
  res.render('index');
});

if (process.env.NODE_ENV !== 'test' ) {
  models.sequelize.sync({ alter:true }).then(()=>{
        
  }).finally(()=>{
    app.use(routes);
    const allRegisterRoutes = listEndpoints(app);
    seeder(allRegisterRoutes).then(()=>{console.log('Seeding done.');});
    //swagger Documentation
    postmanToOpenApi('postman/postman-collection.json', path.join('postman/swagger.yml'), { defaultTag: 'General' }).then(data => {
      let result = YAML.load('postman/swagger.yml');
      result.servers[0].url = '/';
      app.use('/swagger', swaggerUi.serve, swaggerUi.setup(result));
    }).catch(e=>{
      console.log('Swagger Generation stopped due to some error');
    });
  });
  require('./services/socket/socket')(httpServer);
  httpServer.listen(process.env.PORT,()=>{
    console.log(`your application is running on ${process.env.PORT}`);
  });
} else {
  module.exports = app;
}