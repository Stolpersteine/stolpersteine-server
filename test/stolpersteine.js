var restify = require('restify'),
	expect = require('expect.js');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	gzip: true,
	url: 'http://127.0.0.1:3000'
//	url: 'https://stolpersteine-optionu.rhcloud.com/api'
});

var stolpersteinData = {
	person: {
		firstName: "Vorname",
		lastName: "Nachname"
	},
	location: {
		street: "Straße 1",
		zipCode: "10000",
		city: "Stadt",
		coordinates: {
			longitude: "1.0",
			latitude: "1.0"
		}
	},
	source: {
		url: "http://integration.test.example.com",
		name: "Integration Test",
		retrievedAt: new Date()
	},
	description: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa"
};

describe('Stolpersteine endpoint', function() {
	//////////////////////////////////////////////////////////////////////////////
	describe('Life cycle', function() {
		var stolpersteinId = 0;
		
		it('POST /api/stolpersteine should get a 201 response', function(done) {
			client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(201);
				expect(data).to.be.an(Object);
				expect(data.__v).to.be(undefined);
				stolpersteinId = data.id;
				done();
			}); 
		});

		it('GET /api/stolpersteine/:id should get a 200 response', function(done) {
			client.get('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Object);
				expect(data.id).to.be(stolpersteinId);
				expect(data.__v).to.be(undefined);
				done();
			}); 
		});

		it('GET /api/stolpersteine should get a 200 response', function(done) {
			client.get('/api/stolpersteine', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(data[0].__v).to.be(undefined);
				done();
			}); 
		});
	
		it('DELETE /api/stolpersteine/:id should get a 204 response', function(done) {
			client.del('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(204);
				client.get('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) { 
					expect(err).not.to.be(null);
					expect(res.statusCode).to.be(404);
					done();
				}); 
			}); 
		}); 
	});
	
	//////////////////////////////////////////////////////////////////////////////
	describe('Invalid IDs', function() {
		it('GET /api/stolpersteine/:id with invalid id should get a 404 response', function(done) {
			client.get('/api/stolpersteine/0', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		}); 
		
		it('GET /api/imports/:id with non-existent id should get a 404 response', function(done) {
			client.get('/api/stolpersteine/000000000000000000000000', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		}); 

		it('DELETE /api/stolpersteine/:id with invalid id should get a 404 response', function(done) {
			client.del('/api/stolpersteine/0', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		});
		
		it('DELETE /api/stolpersteine/:id with non-existent id should get a 404 response', function(done) {
			client.del('/api/stolpersteine/000000000000000000000000', function(err, req, res, data) { 
				expect(err).not.to.be(null);
				expect(res.statusCode).to.be(404);
				done();
			}); 
		});
	});

	//////////////////////////////////////////////////////////////////////////////
	describe('ETag support', function() {
		var stolpersteinId;
		
		before(function(done) {
			client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
				stolpersteinId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) {
				done(err);
			});
		});
		
		it('GET /api/stolpersteine with etag should get a 304 response', function(done) {
			client.get('/api/stolpersteine', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
			
				// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
				expect(res.headers['content-length']).to.be.greaterThan(1024);
				expect(res.headers['etag']).not.to.be(null);
			
				var options = {
				  path: '/api/stolpersteine',
					headers: { 'If-None-Match': res.headers['etag'] }
				};
				client.get(options, function(err, req, res, data) { 
					expect(err).to.be(null);
					expect(res.statusCode).to.be(304);
					done();
				});
			}); 
		});

		it('GET /api/stolpersteine/:id with etag should get a 304 response', function(done) {
			client.get('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
			
				// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
				expect(res.headers['content-length']).to.be.greaterThan(1024);
				expect(res.headers['etag']).not.to.be(null);
			
				var options = {
				  path: '/api/stolpersteine/' + stolpersteinId,
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
		var stolpersteinId;
		
		before(function(done) {
			client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
				stolpersteinId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) {
				done(err);
			});
		});

		it('GET /api/stolpersteine should use gzip', function(done) {
			var options = {
			  path: '/api/stolpersteine',
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

		it('GET /api/stolpersteine/:id should use gzip', function(done) {
			var options = {
			  path: '/api/stolpersteine/' + stolpersteinId,
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
	describe.only('Search', function() {
		var stolpersteinId;
		
		before(function(done) {
			client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
				stolpersteinId = data.id;
				done(err);
			}); 
		});

		after(function(done) {
			client.del('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) {
				done(err);
			});
		});

		it('GET /api/stolpersteine?q=<non-matching keyword> should get a 200 response', function(done) {
			client.get('/api/stolpersteine?q=test', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(0);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?q=<matching first name> should get a 200 response', function(done) {
			client.get('/api/stolpersteine?q=vorname', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(1);
				expect(data[0].id).to.be(stolpersteinId);
				
				done();
			}); 
		});
	});
});
