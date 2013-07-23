"use strict";
/* global describe:false, it:false, before:false, after:false */

var restify = require('restify'),
	expect = require('expect.js');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	url: 'http://127.0.0.1:3000'
//	url: 'https://stolpersteine-optionu.rhcloud.com/api'
});

var importData = {
	source: {
		url: "http://integration.test.example.com",
		name: "Integration Test",
		retrievedAt: new Date()
	}, 
	stolpersteine: [{
		type: "stolperstein",
		person: {
			firstName: "Vorname",
			lastName: "Nachname1"
		},
		location: {
			street: "Straße 1",
			zipCode: "10000",
			city: "Stadt",
			coordinates: {
				longitude: "0.0",
				latitude: "0.0"
			}
		}
	}, {
		type: "stolperschwelle",
		person: {
			firstName: "Vorname",
			lastName: "Nachname2"
		},
		location: {
			street: "Straße 1",
			zipCode: "10000",
			city: "Stadt",
			coordinates: {
				longitude: "0.0",
				latitude: "0.0"
			}
		}
	}]
};

describe('Import endpoint', function() {
	//////////////////////////////////////////////////////////////////////////////
	describe('Life cycle', function() {
		var importId = 0;
		
		it('POST /v1/imports should get a 201 response', function(done) {
			client.post('/v1/imports', importData, function(err, req, res, data) { 
				console.log(res.statusCode);
				expect(err).to.be(null);
				expect(res.statusCode).to.be(201);
				expect(data).to.be.an(Object);
				expect(data.__v).to.be(undefined);
				importId = data.id;
				done();
			}); 
		});

		it('GET /v1/imports/:id should get a 200 response', function(done) {
			client.get('/v1/imports/' + importId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(res.headers['content-type']).to.be('application/json; charset=utf-8');
				expect(data).to.be.an(Object);
				expect(data.id).to.be(importId);
				expect(data.__v).to.be(undefined);
				done();
			}); 
		});

		it('GET /v1/imports should get a 200 response', function(done) {
			client.get('/v1/imports', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(data[0].__v).to.be(undefined);
				done();
			}); 
		});
	
		it('DELETE /v1/imports/:id should get a 204 response', function(done) {
			client.del('/v1/imports/' + importId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(204);
				client.get('/v1/imports/' + importId, function(err, req, res, data) { 
					expect(err).not.to.be(null);
					expect(res.statusCode).to.be(404);
					done();
				}); 
			}); 
		}); 
	});
	
	//////////////////////////////////////////////////////////////////////////////
	describe('Invalid IDs', function() {
		it('GET /v1/imports/:id with invalid id should get a 404 response', function(done) {
			client.get('/v1/imports/0', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		}); 
		
		it('GET /v1/imports/:id with non-existent id should get a 404 response', function(done) {
			client.get('/v1/imports/000000000000000000000000', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		}); 

		it('DELETE /v1/imports/:id with invalid id should get a 404 response', function(done) {
			client.del('/v1/imports/0', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		});
		
		it('DELETE /v1/imports/:id with non-existent id should get a 404 response', function(done) {
			client.del('/v1/imports/000000000000000000000000', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		});
	});

	//////////////////////////////////////////////////////////////////////////////
	describe('Validation support', function() {
		var importId;
		
		before(function(done) {
			client.post('/v1/imports', importData, function(err, req, res, data) { 
				importId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/v1/imports/' + importId, function(err, req, res, data) {
				done(err);
			});
		});
		
		it('GET /v1/imports with etag should get a 304 response', function(done) {
			client.get('/v1/imports', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
			
				// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
				expect(res.headers['content-length']).to.be.greaterThan(1024);
				expect(res.headers.etag).not.to.be(null);

				var options = {
					path: '/v1/imports',
					headers: { 'If-None-Match': res.headers.etag }
				};
				client.get(options, function(err, req, res, data) { 
					expect(err).to.be(null);
					expect(res.statusCode).to.be(304);
					done();
				});
			}); 
		});

		it('GET /v1/imports/:id with etag should get a 304 response', function(done) {
			client.get('/v1/imports/' + importId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
			
				// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
				expect(res.headers['content-length']).to.be.greaterThan(1024);
				expect(res.headers.etag).not.to.be(null);
			
				var options = {
					path: '/v1/imports/' + importId,
					headers: { 'If-None-Match': res.headers.etag }
				};
				client.get(options, function(err, req, res, data) { 
					expect(err).to.be(null);
					expect(res.statusCode).to.be(304);
					done();
				});
			}); 
		});
	});

	//////////////////////////////////////////////////////////////////////////////
	describe('gzip support', function() {
		var importId;
		
		before(function(done) {
			client.post('/v1/imports', importData, function(err, req, res, data) { 
				importId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/v1/imports/' + importId, function(err, req, res, data) {
				done(err);
			});
		});

		it('GET /v1/imports should use gzip', function(done) {
			var options = {
				path: '/v1/imports',
				headers: { 'Accept-Encoding': 'gzip' }
			};
		
			client.get(options, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(res.headers['content-encoding']).to.equal("gzip");
				done();
			}); 
		});

		it('GET /v1/imports/:id should use gzip', function(done) {
			var options = {
				path: '/v1/imports/' + importId,
				headers: { 'Accept-Encoding': 'gzip' }
			};
		
			client.get(options, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(res.headers['content-encoding']).to.equal("gzip");
				done();
			}); 
		});
	});
	
	//////////////////////////////////////////////////////////////////////////////
	describe('Import execution', function() {
		var stolpersteinToRetainId, stolpersteinToDeleteId, stolpersteinToCreateId;
		var importId;
		
		before(function(done) {
			var originalLastName = importData.stolpersteine[0].person.lastName;
			var stolperstein = importData.stolpersteine[0];	// 'Nachname1'
			stolperstein.source = importData.source;
			client.post('/v1/stolpersteine', stolperstein, function(err, req, res, data) { 
				stolpersteinToRetainId = data.id;
				
				stolperstein.person.lastName = "NachnameXYZ";
				client.post('/v1/stolpersteine', stolperstein, function(err, req, res, data) { 
					stolperstein.person.lastName = originalLastName;
					stolpersteinToDeleteId = data.id;
					done(err);
				});
			}); 
		});

		after(function(done) {
			client.del('/v1/stolpersteine/' + stolpersteinToRetainId, function(err, req, res, data) {
				client.del('/v1/stolpersteine/' + stolpersteinToDeleteId, function(err, req, res, data) {
					client.del('/v1/stolpersteine/' + stolpersteinToCreateId, function(err, req, res, data) {
						done();
					});
				});
			});
		});
		
		it('Import creates delta list', function(done) {
			client.post('/v1/imports', importData, function(err, req, res, data) {
				stolpersteinToCreateId = data.createActions.stolpersteine[0].id;
				importId = data.id;
				
				expect(data.createActions.stolpersteine.length).to.be(1);
				expect(data.createActions.stolpersteine[0].person.lastName).to.be(importData.stolpersteine[1].person.lastName);	// 'Nachname2'
				expect(data.deleteActions.targetIds.length).to.be(1);
				expect(data.deleteActions.targetIds[0]).to.be(stolpersteinToDeleteId);
				expect(data.executedAt).to.be(undefined);
				done(err);
			});
		});
		
		it('Import execution', function(done) {
			client.post('/v1/imports/' + importId + '/execute', importData, function(err, req, res, data) {
				expect(err).to.be(null);
				expect(res.statusCode).to.be(201);
				expect(data.executedAt).not.to.be(undefined);
				client.get('/v1/stolpersteine/' + stolpersteinToRetainId, function(err, req, res, data) {
					expect(res.statusCode).to.be(200);
					client.get('/v1/stolpersteine/' + stolpersteinToCreateId, function(err, req, res, data) {
						expect(res.statusCode).to.be(200);
						client.get('/v1/stolpersteine/' + stolpersteinToDeleteId, function(err, req, res, data) {
							expect(res.statusCode).to.be(404);
							done();
						});
					});
				});
			});
		});
	});
});
