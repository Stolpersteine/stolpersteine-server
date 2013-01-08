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

exports.retrieveImports = function(req, res) {
	console.log("retrieveImports");
	models.import.Import.find(function(err, stolpersteine) {
		if (!err) {
			res.send(stolpersteine);
		} else {
			res.send(400, err);
		}
	});
}

exports.retrieveImport = function(req, res) {
	models.import.Import.findById(req.params.id, { __v: 0 }, null, function(err, stolperstein) {
		if (!err && stolperstein) {
			res.send(stolperstein);
		} else {
			res.send(404, err);
		}
	});
}

exports.deleteImport = function(req, res) {
	models.import.Import.findByIdAndRemove(req.params.id, { __v: 0 }, function(err, stolperstein) {
		if (!err) {
			res.send(204);
		} else {
			res.send(404, err);
		}
	});
}