var restify = require('restify');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	url: 'http://127.0.0.1:3000'
});

describe('200 response check', function() {
	it('should get a 200 response', function(done) {
		client.get('/api/stolpersteine', function(err, req, res, data) { 
			if (err) { 
				throw new Error(err); 
			} else { 
				if (res.statusCode != 200) { 
					throw new Error('invalid response');
        } 
				done();
			} 
		}); 
	}); 
});
