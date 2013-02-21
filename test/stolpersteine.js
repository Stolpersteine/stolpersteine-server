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
		sublocality1: "Bezirk",
		sublocality2: "Ortsteil",
		coordinates: {
			longitude: 1.0,
			latitude: 1.0
		}
	},
	source: {
		url: "http://integration.test.example.com",
		name: "Integration Test",
		retrievedAt: new Date()
	},
	description: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaa"
};

function containsId(stolpersteine, id) {
	var containsId = false;
	for (var i = 0, len = stolpersteine.length; i < len; i++) {
		if (stolpersteine[i].id === id) {
			containsId = true;
	  	break;
		}
	}
	
	return containsId;
}

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
				expect(res.headers['content-type']).to.be('application/json; charset=utf-8');
				expect(data).to.be.an(Object);
				expect(data.id).to.be(stolpersteinId);
				expect(data.person.firstName).to.be(stolpersteinData.person.firstName);
				expect(data.person.lastName).to.be(stolpersteinData.person.lastName);
				expect(data.location.street).to.be(stolpersteinData.location.street);
				expect(data.location.zipCode).to.be(stolpersteinData.location.zipCode);
				expect(data.location.city).to.be(stolpersteinData.location.city);
				expect(data.location.sublocalityLevel1).to.be(stolpersteinData.location.sublocalityLevel1);
				expect(data.location.sublocalityLevel2).to.be(stolpersteinData.location.sublocalityLevel2);
				expect(data.location.coordinates.longitude).to.be(stolpersteinData.location.coordinates.longitude);
				expect(data.location.coordinates.latitude).to.be(stolpersteinData.location.coordinates.latitude);
				expect(data.source.url).to.be(stolpersteinData.source.url);
				expect(data.source.name).to.be(stolpersteinData.source.name);
				expect(data.source.retrievedAt).not.to.be(null);
				expect(data.description).to.be(stolpersteinData.description);
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
	describe('Validation support', function() {
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
			
				// Manual ETag implementation without content-length
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
	describe('Search keyword', function() {
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

		it('GET /api/stolpersteine?q=<keyword> should not have any results for non-matching keyword', function(done) {
			client.get('/api/stolpersteine?source=integration&q=xyz', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(0);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?q=<keyword> should have results for matching first name', function(done) {
			client.get('/api/stolpersteine?source=integration&q=vorna', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?q=<keyword> should have results for matching last name', function(done) {
			client.get('/api/stolpersteine?source=integration&q=nachna', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?q=<keyword> should have results for matching street', function(done) {
			client.get('/api/stolpersteine?source=integration&q=stra', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?q=<keyword> should have results for matching zip code', function(done) {
			client.get('/api/stolpersteine?source=integration&q=1000', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?q=<keyword> should have results for matching sublocality', function(done) {
			client.get('/api/stolpersteine?source=integration&q=Bezi', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});
	});
	
	//////////////////////////////////////////////////////////////////////////////
	describe('Search street', function() {
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

		it('GET /api/stolpersteine?street=<street> should not have any results for non-matching street', function(done) {
			client.get('/api/stolpersteine?source=integration&street=xyz', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(0);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?street=<street> should have results for matching street', function(done) {
			client.get('/api/stolpersteine?source=integration&street=' + encodeURIComponent('straße'), function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});
	});
	
	//////////////////////////////////////////////////////////////////////////////
	describe('Search source', function() {
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

		it('GET /api/stolpersteine?source=<source> should not have any results for npn-matching source', function(done) {
			client.get('/api/stolpersteine?source=xyz', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(0);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?source=<source> should have results for matching source', function(done) {
			client.get('/api/stolpersteine?source=integration', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be.greaterThan(0);
				expect(containsId(data, stolpersteinId)).to.be(true);
				
				done();
			}); 
		});
	});

	//////////////////////////////////////////////////////////////////////////////
	describe('Pagination', function() {
		var stolpersteinId0, stolpersteinId1, stolpersteinId2;
		
		before(function(done) {
			client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
				stolpersteinId0 = data.id;
				client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
					stolpersteinId1 = data.id;
					client.post('/api/stolpersteine', stolpersteinData, function(err, req, res, data) { 
						stolpersteinId2 = data.id;
						done(err);
					});
				});
			}); 
		});

		after(function(done) {
			client.del('/api/stolpersteine/' + stolpersteinId0, function(err, req, res, data) {
				client.del('/api/stolpersteine/' + stolpersteinId1, function(err, req, res, data) {
					client.del('/api/stolpersteine/' + stolpersteinId2, function(err, req, res, data) {
						done(err);
					});
				});
			});
		});

		it('GET /api/stolpersteine?limit=<limit>&offset=<offset> should have 1 result for (1, 0)', function(done) {
			client.get('/api/stolpersteine?source=integration&limit=1&offset=0', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(1);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?limit=<limit> should have 1 result for limit 1', function(done) {
			client.get('/api/stolpersteine?source=integration&limit=1', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(1);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?limit=<limit>&offset=<offset> should have 3 results for (3, 0)', function(done) {
			client.get('/api/stolpersteine?source=integration&limit=3&offset=0', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(3);
				expect(containsId(data, stolpersteinId0)).to.be(true);
				expect(containsId(data, stolpersteinId1)).to.be(true);
				expect(containsId(data, stolpersteinId2)).to.be(true);
				
				done();
			}); 
		});
		
		it('GET /api/stolpersteine?limit=<limit> should have 3 results for limit 0', function(done) {
			client.get('/api/stolpersteine?source=integration&limit=0', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(3);
				expect(containsId(data, stolpersteinId0)).to.be(true);
				expect(containsId(data, stolpersteinId1)).to.be(true);
				expect(containsId(data, stolpersteinId2)).to.be(true);
				
				done();
			}); 
		});
		
		it('GET /api/stolpersteine?limit=<limit>&offset=<offset> should have 1 result for (1, 2)', function(done) {
			client.get('/api/stolpersteine?source=integration&limit=1&offset=2', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(1);
				
				done();
			}); 
		});

		it('GET /api/stolpersteine?limit=<limit>&offset=<offset> should have 0 results for (1, 3)', function(done) {
			client.get('/api/stolpersteine?source=integration&limit=1&offset=3', function(err, req, res, data) { 
				expect(err).to.be(null);
				expect(res.statusCode).to.be(200);
				expect(data).to.be.an(Array);
				expect(data.length).to.be(0);
				
				done();
			}); 
		});
	});
});
