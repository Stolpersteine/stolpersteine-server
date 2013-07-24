// Copyright (C) 2013 Option-U Software
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

"use strict";
/* jshint -W024 */
 
var express = require('express'),
	http = require('http'),
	path = require('path'),
	mongoose = require('mongoose'),
	controllers = require('./controllers'),
	middleware = require('./middleware');

var app = express();

console.log('Node.js env = ' + app.get('env'));

app.configure(function() {
  app.set('port', process.env.VCAP_APP_PORT || process.env.OPENSHIFT_INTERNAL_PORT || 3000);
  app.set('host', process.env.VCAP_APP_HOST || process.env.OPENSHIFT_INTERNAL_IP || "127.0.0.1");
  app.set('db url', process.env.MONGODB_DB_URL || process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://127.0.0.1/");

  app.use(express.logger('dev'));
  app.use('/v1', express.bodyParser());
  app.use('/v1', express.methodOverride());
	app.use('/v1', express.compress());
	app.use('/v1', middleware.filter());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.post('/v1/stolpersteine', controllers.stolpersteine.createStolperstein);
app.get('/v1/stolpersteine', controllers.stolpersteine.retrieveStolpersteine);
app.get('/v1/stolpersteine/:id', controllers.stolpersteine.retrieveStolperstein);
app.delete('/v1/stolpersteine/:id', controllers.stolpersteine.deleteStolperstein);
app.post('/v1/imports', controllers.imports.createImport);
app.get('/v1/imports', controllers.imports.retrieveImports);
app.get('/v1/imports/:id', controllers.imports.retrieveImport);
app.delete('/v1/imports/:id', controllers.imports.deleteImport);
app.post('/v1/imports/:id/execute', controllers.imports.executeImport);

mongoose.connect(app.get('db url') + 'stolpersteine');
app.listen(app.get('port'), app.get('host'), function() {
    console.log('%s: Node server started on %s:%d ...', Date(Date.now()), app.get('host'), app.get('port'));
});
