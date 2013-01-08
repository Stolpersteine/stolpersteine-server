var models = require('../models')

exports.createImport = function(req, res) {
	console.log(req.body.source);
	
	var importData = new models.import.Import();
	importData.source = req.body.source;
	importData.createActions.stolpersteine = req.body.stolpersteine;
	importData.save(function(err, importData) {
		if (!err) {
			res.send(201, importData);
		} else {
			res.send(400, err);
		}
	});
}

exports.retrieveImports = function(req, res) {
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
	models.import.Import.findById(req.params.id, { __v: 0 }, null, function(err, importData) {
		if (!err && importData) {
			importData.createActions.stolpersteine.forEach(function(stolpersteinData, index, array) {
				var stolperstein = new models.stolperstein.Stolperstein(stolpersteinData);
				stolperstein.save(function(err, stolperstein) {
				});
			})
			res.send(201);
		} else {
			res.send(404, err);
		}
	});
}