/**
 * Stolpersteine
 */
 
var express = require('express')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
	, controllers = require('./controllers')
	, middleware = require('./middleware');

var app = express();

console.log('Node.js env = ' + app.get('env'));

app.configure(function() {
  app.set('port', process.env.OPENSHIFT_INTERNAL_PORT || 3000);
  app.set('host', process.env.OPENSHIFT_INTERNAL_IP || "localhost");
  app.set('db url', process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://localhost/");
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use('/api', express.bodyParser());
  app.use('/api', express.methodOverride());
	app.use('/api', express.compress());
	app.use('/api', middleware.filter());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.post('/api/stolpersteine', controllers.stolpersteine.createStolperstein);
app.get('/api/stolpersteine', controllers.stolpersteine.retrieveStolpersteine);
app.get('/api/stolpersteine/:id', controllers.stolpersteine.retrieveStolperstein);
app.delete('/api/stolpersteine/:id', controllers.stolpersteine.deleteStolperstein);
app.post('/api/imports', controllers.imports.createImport);
app.get('/api/imports', controllers.imports.retrieveImports);
app.get('/api/imports/:id', controllers.imports.retrieveImport);
app.delete('/api/imports/:id', controllers.imports.deleteImport);
app.post('/api/imports/:id/execute', controllers.imports.executeImport);

mongoose.connect(app.get('db url') + 'stolpersteine');
app.listen(app.get('port'), app.get('host'), function() {
    console.log('%s: Node server started on %s:%d ...', Date(Date.now()), app.get('host'), app.get('port'));
});
