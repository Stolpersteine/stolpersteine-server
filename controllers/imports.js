var models = require('../models'),
	async = require('async');

exports.createImport = function(req, res) {
	console.log(req.body.source);
	
	var source = req.body.source;
	var stolpersteine = req.body.stolpersteine;
	
	async.waterfall([
		// Find old imports
		function(callback) {
			models.import.Import.find({"source.url": source.url}, function(err, oldImports) {
				callback(err, oldImports);
			});
		},
		// Delete those imports
		function(oldImports, callback) {
			async.forEach(oldImports, function(oldImport, callback) {
				oldImport.remove(function(err) {
					callback(err);
				});
			}, function(err) {
			    callback(err);
			});
		},
		// Figure out difference between existing stolpersteine and imported ones
		function(callback) {
			var importData = new models.import.Import();
			importData.source = source;
			
			async.forEach(stolpersteine, function(stolperstein, callback) {
				console.log(stolperstein.person.lastName);
				
				// Check if stolperstein exists
				
				callback(null);
			}, function(err) {
			    callback(err, importData);
			});
		},
		// Store import data
		function(importData, callback) {
			importData.save(function(err, importData) {
				callback(err, importData);
			});
		}
	], function (err, importData) {
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
			async.parallel([
				function(callback) {
					async.forEach(importData.createActions.stolpersteine, function(stolperstein, callback) {
						var stolperstein = new models.stolperstein.Stolperstein(stolperstein);
						stolperstein.source = importData.source;
						stolperstein.save(function(err, stolperstein) {
							callback(err);
						});
					}, function(err) {
			    	callback(err);
					});
		    }
			],
			function(err, results) {
				res.send(201);
			});
		} else {
			res.send(404, err);
		}
	});
}