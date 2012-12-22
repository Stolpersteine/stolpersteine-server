var restify = require('restify'),
	expect = require('expect.js');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	url: 'http://127.0.0.1:3000'
});

describe('stolpersteine endpoint', function() {
	it('should get a 200 response expect', function(done) {
		client.get('/api/stolpersteine', function(err, req, res, data) { 
			expect(err).to.be(null);
			expect(res.statusCode).to.be(200);
			expect(data).to.be.an(Array);
			expect(data.length).to.be.greaterThan(0);
			done();
		}); 
	});

	it('should get a 400 response', function(done) {
		client.get('/api/stolpersteine/123', function(err, req, res, data) { 
			expect(err).not.to.be(null);
			expect(res.statusCode).to.be(400);
			done();
		}); 
	}); 
});
