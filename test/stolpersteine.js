var restify = require('restify'),
	should = require('should');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	url: 'http://127.0.0.1:3000'
});

describe('stolpersteine endpoint', function() {
	it('should get a 200 response', function(done) {
		client.get('/api/stolpersteine', function(err, req, res, data) { 
			should.not.exist(err);
			should.exist(res);
			should.exist(data);
			res.statusCode.should.equal(200);
			data.length.should.be.above(0);
			done();
		}); 
	});
	
	it('should get a 400 response', function(done) {
		client.get('/api/stolpersteine/123', function(err, req, res, data) { 
			should.exist(err);
			should.exist(res);
			res.statusCode.should.equal(400);
			done();
		}); 
	}); 
});
