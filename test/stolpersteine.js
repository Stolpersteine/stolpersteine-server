var restify = require('restify'),
	expect = require('expect.js');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	gzip: true,
	url: 'http://127.0.0.1:3000'
});

var stolpersteinId = 0;
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
	}
};

describe('Stolpersteine endpoint', function() {
	it('POST /api/stolpersteine should get a 201 response', function(done) {
		client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
			expect(err).to.be(null);
			expect(res.statusCode).to.be(201);
			expect(data).to.be.an(Object);
			stolpersteinId = data._id;
			done();
		}); 
	});

	it('GET /api/stolperstein/:id should get a 200 response', function(done) {
		client.get('/api/stolpersteine/' + stolpersteinId, function(err, req, res, data) { 
			expect(err).to.be(null);
			expect(res.statusCode).to.be(200);
			expect(data).to.be.an(Object);
			expect(data._id).to.be(stolpersteinId);
			done();
		}); 
	});

	it('GET /api/stolperstein/:id with invalid id should get a 404 response', function(done) {
		client.get('/api/stolpersteine/0', function(err, req, res, data) { 
			expect(err).not.to.be(null);
			expect(res.statusCode).to.be(404);
			done();
		}); 
	}); 

	it('GET /api/stolpersteine should get a 200 response', function(done) {
		client.get('/api/stolpersteine', function(err, req, res, data) { 
			expect(err).to.be(null);
			expect(res.statusCode).to.be(200);
			expect(data).to.be.an(Array);
			expect(data.length).to.be.greaterThan(0);
			done();
		}); 
	});
	
	it('GET /api/stolpersteine with etag should get a 304 response', function(done) {
		client.get('/api/stolpersteine', function(err, req, res, data) { 
			expect(err).to.be(null);
			expect(res.statusCode).to.be(200);
			
			// As of version 3.0.x, Express only creates an etag when the content is larger than 1024 bytes
			var contentLength = new Number(res.headers['content-length']);
			if (contentLength <= 1024) {
				done();
			} else {
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
			}
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

	it('DELETE /api/stolperstein/:id should get a 204 response', function(done) {
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

	it('DELETE /api/stolperstein/:id with invalid id should get a 404 response', function(done) {
		client.del('/api/stolpersteine/0', function(err, req, res, data) { 
			expect(err).not.to.be(null);
			expect(res.statusCode).to.be(404);
			done();
		}); 
	}); 
});
