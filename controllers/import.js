var models = require('../models')

exports.createImport = function(req, res) {
	console.log(req.body);
	
	var importData = new models.import.Import({
		source: { 
			url: 'http://test.example.com',
	    name: 'Integration Test',
	    retrievedAt: '2013-01-06T18:12:17.603Z' 
		},
		actions: [{
			action: "create",
			sourceData: [{
				"person": {
					"firstName": "Vorname",
					"lastName": "Nachname"
				},
				"location": {
					"street": "Straße 1",
					"zipCode": "10000",
					"city": "Stadt",
					"coordinates": {
						"longitude": "1.0",
						"latitude": "1.0"
					}
				}
			}]
		}]
	});
	importData.save(function(err, importData) {
		if (!err) {
			res.send(201, importData);
		} else {
			res.send(400, err);
		}
	});
}
