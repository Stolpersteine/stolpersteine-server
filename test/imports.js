var restify = require('restify'),
	expect = require('expect.js');

// init the test client
var client = restify.createJsonClient({
	version: '*',
	gzip: true,
	url: 'http://127.0.0.1:3000'
});

var importData = {
	source: {
		url: "http://integration.test.example.com",
		name: "Integration Test",
		retrievedAt: new Date()
	}, 
	stolpersteine: [{
		person: {
			firstName: "Vorname",
			lastName: "Nachname 0"
		},
		location: {
			street: "Straße 1",
			zipCode: "10000",
			city: "Stadt",
			coordinates: {
				longitude: "0.0",
				latitude: ".0"
			}
		}
	}, {
		person: {
			firstName: "Vorname",
			lastName: "Nachname 1"
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
	before(function(done) {
		console.log('before');
		done();
	})

	after(function(done) {
		console.log('after');
		done();
	})
	
	it('POST /api/import should get a 201 response', function(done) {
		client.post('/api/imports', importData, function(err, req, res, data) { 
			expect(err).to.be(null);
			expect(res.statusCode).to.be(201);
			expect(data).to.be.an(Object);
//			stolpersteinId = data._id;
			done();
		}); 
	});
});
