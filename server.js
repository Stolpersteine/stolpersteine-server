/**
 * Stolpersteine
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

var app = express();

app.configure(function(){
  app.set('port', process.env.OPENSHIFT_INTERNAL_PORT || 3000);
  app.set('ip address', process.env.OPENSHIFT_INTERNAL_IP || "127.0.0.1");
  app.set('db url', process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://localhost/test");
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

mongoose.connect(app.get('db url'));

app.listen(app.get('port'), app.get('ip address'), function() {
    console.log('%s: Node server started on %s:%d ...', Date(Date.now() ), app.get('ip address'), app.get('port'));
});
