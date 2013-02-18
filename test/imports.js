var restify = require('restify'),
	expect = require('expect.js');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	gzip: true,
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
		person: {
			name: "Vorname Nachname"
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
		person: {
			name: "Vorname Nachname"
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
		
		it('POST /api/imports should get a 201 response', function(done) {
			client.post('/api/imports', importData, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(201);
				expect(data).to.be.an(Object);
				expect(data.__v).to.be(undefined);
				importId = data.id;
				done();
			}); 
		});

		it('GET /api/imports/:id should get a 200 response', function(done) {
			client.get('/api/imports/' + importId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(res.headers['content-type']).to.be('application/json; charset=utf-8');
				expect(data).to.be.an(Object);
				expect(data.id).to.be(importId);
				expect(data.__v).to.be(undefined);
				done();
			}); 
		});

		it('GET /api/imports should get a 200 response', function(done) {
			client.get('/api/imports', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(data[0].__v).to.be(undefined);
				done();
			}); 
		});
	
		it('DELETE /api/imports/:id should get a 204 response', function(done) {
			client.del('/api/imports/' + importId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(204);
				client.get('/api/imports/' + importId, function(err, req, res, data) { 
					expect(err).not.to.be(null);
					expect(res.statusCode).to.be(404);
					done();
				}); 
			}); 
		}); 
	});
	
	//////////////////////////////////////////////////////////////////////////////
	describe('Invalid IDs', function() {
		it('GET /api/imports/:id with invalid id should get a 404 response', function(done) {
			client.get('/api/imports/0', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		}); 
		
		it('GET /api/imports/:id with non-existent id should get a 404 response', function(done) {
			client.get('/api/imports/000000000000000000000000', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		}); 

		it('DELETE /api/imports/:id with invalid id should get a 404 response', function(done) {
			client.del('/api/imports/0', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		});
		
		it('DELETE /api/imports/:id with non-existent id should get a 404 response', function(done) {
			client.del('/api/imports/000000000000000000000000', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		});
	});

	//////////////////////////////////////////////////////////////////////////////
	describe('ETag support', function() {
		var importId;
		
		before(function(done) {
			client.post('/api/imports', importData, function(err, req, res, data) { 
				importId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/api/imports/' + importId, function(err, req, res, data) {
				done(err);
			});
		});
		
		it('GET /api/imports with etag should get a 304 response', function(done) {
			client.get('/api/imports', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
			
				// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
				expect(res.headers['content-length']).to.be.greaterThan(1024);
				expect(res.headers['etag']).not.to.be(null);
			
				var options = {
				  path: '/api/imports',
					headers: { 'If-None-Match': res.headers['etag'] }
				};
				client.get(options, function(err, req, res, data) { 
					expect(err).to.be(null);
					expect(res.statusCode).to.be(304);
					done();
				});
			}); 
		});

		it('GET /api/imports/:id with etag should get a 304 response', function(done) {
			client.get('/api/imports/' + importId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
			
				// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
				expect(res.headers['content-length']).to.be.greaterThan(1024);
				expect(res.headers['etag']).not.to.be(null);
			
				var options = {
				  path: '/api/imports/' + importId,
					headers: { 'If-None-Match': res.headers['etag'] }
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
			client.post('/api/imports', importData, function(err, req, res, data) { 
				importId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/api/imports/' + importId, function(err, req, res, data) {
				done(err);
			});
		});

		it('GET /api/imports should use gzip', function(done) {
			var options = {
			  path: '/api/imports',
				headers: { 'Accept-Encoding': 'gzip' }
			};
		
			client.get(options, function(err, req, res, data) { 
				// As of Restify 1.4.x, the JsonClient doesn't automatically decompress gzip'ed data
	//			expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(res.headers['content-encoding']).to.equal("gzip");
				done();
			}); 
		});

		it('GET /api/imports/:id should use gzip', function(done) {
			var options = {
			  path: '/api/imports/' + importId,
				headers: { 'Accept-Encoding': 'gzip' }
			};
		
			client.get(options, function(err, req, res, data) { 
				// As of Restify 1.4.x, the JsonClient doesn't automatically decompress gzip'ed data
	//			expect(err).to.be(null);
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
			var stolperstein = importData.stolpersteine[0];	// 'Nachname 0'
			stolperstein.source = importData.source;
			client.post('/api/stolpersteine', stolperstein, function(err, req, res, data) { 
				stolpersteinToRetainId = data.id;
				
				stolperstein.person.lastName = "Nachname 2";
				client.post('/api/stolpersteine', stolperstein, function(err, req, res, data) { 
					stolperstein.person.lastName = "Nachname 0";
					stolpersteinToDeleteId = data.id;
					done(err);
				});
			}); 
		});

		after(function(done) {
			client.del('/api/stolpersteine/' + stolpersteinToRetainId, function(err, req, res, data) {
				client.del('/api/stolpersteine/' + stolpersteinToDeleteId, function(err, req, res, data) {
					client.del('/api/stolpersteine/' + stolpersteinToCreateId, function(err, req, res, data) {
						done();
					});
				});
			});
		});
		
		it('Import creates delta list', function(done) {
			client.post('/api/imports', importData, function(err, req, res, data) {
				stolpersteinToCreateId = data.createActions.stolpersteine[0].id;
				importId = data.id;
				
				expect(data.createActions.stolpersteine.length).to.be(1);
				expect(data.createActions.stolpersteine[0].person.lastName).to.be(importData.stolpersteine[1].person.lastName);	// 'Nachname 1'
				expect(data.deleteActions.targetIds.length).to.be(1);
				expect(data.deleteActions.targetIds[0]).to.be(stolpersteinToDeleteId);
				done(err);
			});
		});
		
		it('Import execution', function(done) {
			client.post('/api/imports/' + importId + '/execute', importData, function(err, req, res, data) {
				expect(err).to.be(null);
				expect(res.statusCode).to.be(201);
				client.get('/api/stolpersteine/' + stolpersteinToRetainId, function(err, req, res, data) {
					expect(res.statusCode).to.be(200);
					client.get('/api/stolpersteine/' + stolpersteinToCreateId, function(err, req, res, data) {
						expect(res.statusCode).to.be(200);
						client.get('/api/stolpersteine/' + stolpersteinToDeleteId, function(err, req, res, data) {
							expect(res.statusCode).to.be(404);
							done();
						});
					});
				});
			});
		});
	});
});
