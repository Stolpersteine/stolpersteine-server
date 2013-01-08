var models = require('../models')

exports.createImport = function(req, res) {
//	console.log(req.body);
	
	var importData = new models.import.Import({
		source: { 
			url: 'http://test.example.com',
	    name: 'Integration Test 2',
	    retrievedAt: '2013-01-06T18:12:17.603Z' 
		}
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

exports.executeImport = function(req, res) {
	console.log("executeImport");
	res.send(400);
}