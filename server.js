var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var dotenv = require('dotenv');
var React = require('react');
var ReactDOM = require('react-dom/server');
var Router = require('react-router');
var Provider = require('react-redux').Provider;
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var request = require('request');
var sass = require('node-sass-middleware');
var webpack = require('webpack');
var config = require('./webpack.config');
const wrap = require('co-express');
const devices = require('./controllers/api/devices');
const components = require('./controllers/api/components');
const gpios = require('./controllers/api/gpios');
const appController = require('./controllers/api/app');

const fs = require('fs');
const join = require('path').join;
const models = join(__dirname, './models');

// Bootstrap models
fs.readdirSync(models)
  .filter(file => ~file.indexOf('.js'))
  .forEach(file => require(join(models, file)));

// Load environment variables from .env file
dotenv.load();

// ES6 Transpiler
require('babel-core/register');
require('babel-polyfill');

// Models
var User = require('./models/User');

// Controllers
var userController = require('./controllers/user');
var contactController = require('./controllers/contact');

// React and Server-Side Rendering
var routes = require('./app/routes');
var configureStore = require('./app/store/configureStore').default;

var app = express();

var compiler = webpack(config);

mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

var hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    ifeq: function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    toJSON : function(object) {
      return JSON.stringify(object);
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(sass({ src: path.join(__dirname, 'public'), dest: path.join(__dirname, 'public') }));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  req.isAuthenticated = function() {
    var token = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.cookies.token;
    try {
      return jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (err) {
      return false;
    }
  };

  if (req.isAuthenticated()) {
    var payload = req.isAuthenticated();
    User.findById(payload.sub, function(err, user) {
      req.user = user;
      next();
    });
  } else {
    next();
  }
});

if (app.get('env') === 'development') {
  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}

app.post('/contact', contactController.contactPost);
app.put('/account', userController.ensureAuthenticated, userController.accountPut);
app.delete('/account', userController.ensureAuthenticated, userController.accountDelete);
app.post('/signup', userController.signupPost);
app.post('/login', userController.loginPost);
app.post('/forgot', userController.forgotPost);
app.post('/reset/:token', userController.resetPost);
app.get('/unlink/:provider', userController.ensureAuthenticated, userController.unlink);
app.post('/auth/facebook', userController.authFacebook);
app.get('/auth/facebook/callback', userController.authFacebookCallback);
app.post('/auth/google', userController.authGoogle);
app.get('/auth/google/callback', userController.authGoogleCallback);
app.post('/auth/twitter', userController.authTwitter);
app.get('/auth/twitter/callback', userController.authTwitterCallback);
app.post('/auth/github', userController.authGithub);
app.get('/auth/github/callback', userController.authGithubCallback);


app.post('/api/devices/join', userController.ensureAuthenticated,  devices.join);
app.get('/api/components', userController.ensureAuthenticated,  components.get);
app.get('/api/components/:id', userController.ensureAuthenticated,  components.getById);
app.post('/api/components', userController.ensureAuthenticated,  components.create);
app.put('/api/components/socket/:id', userController.ensureAuthenticated,  components.socket);
app.put('/api/components/dimmer/:id', userController.ensureAuthenticated,  components.dimmer);
app.put('/api/components/switch/:id', userController.ensureAuthenticated,  components.switch);
app.put('/api/components/switchBlind/:id', userController.ensureAuthenticated,  components.switchBlind);
app.put('/api/components/switchAudio/:id', userController.ensureAuthenticated,  components.switchAudio);
app.get('/api/components/testAC/:id', userController.ensureAuthenticated,  components.testAC);
app.get('/api/components/temperatureSensor/:id', userController.ensureAuthenticated,  components.temperatureSensor);
app.get('/api/components/luminanceSensor/:id', userController.ensureAuthenticated,  components.luminanceSensor);
app.delete('/api/components/:id', userController.ensureAuthenticated,  components.remove);

app.get('/api/test', userController.ensureAuthenticated,  components.test);

app.get('/api/app/ping', appController.ping);
app.put('/api/gpiosVirtual/:ip/:number', userController.ensureAuthenticated,  gpios.updateVirtualGpio);
app.post('/api/gpiosVirtual/availables', gpios.getAvailablesGpios);
app.get('/api/gpios/device', userController.ensureAuthenticated,  gpios.getDeviceGpios);
app.get('/api/gpios/reset/out/:value', userController.ensureAuthenticated,  gpios.reset);
app.put('/api/gpios/:number', userController.ensureAuthenticated,  gpios.set);
app.put('/api/gpios/:number/action', userController.ensureAuthenticated,  gpios.changeState);
app.get('/api/gpios/:number', userController.ensureAuthenticated,  gpios.get);
app.get('/api/gpios/:number/dht', userController.ensureAuthenticated,  gpios.getDhtSensor);
app.get('/api/gpios/:number/analog', userController.ensureAuthenticated,  gpios.getAnalogValue);


// React server rendering
app.use(function(req, res) {
  var initialState = {
    auth: { token: req.cookies.token, user: req.user },
    messages: {}
  };

  var store = configureStore(initialState);

  Router.match({ routes: routes.default(store), location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      var html = ReactDOM.renderToString(React.createElement(Provider, { store: store },
        React.createElement(Router.RouterContext, renderProps)
      ));
      res.render('layouts/main', {
        html: html,
        initialState: store.getState()
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}

app.listen(app.get('port'), wrap(function*() {
  console.log('Express server listening on port ' + app.get('port'));
}));

module.exports = app;
