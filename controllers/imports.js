var models = require('../models'),
	async = require('async');

exports.createImport = function(req, res) {
	console.log(req.body.source);
	
	var source = req.body.source;
	var stolpersteineImport = req.body.stolpersteine;
	
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
			var newImport = new models.import.Import();
			newImport.source = source;
			
			async.forEach(stolpersteineImport, function(stolpersteinImport, callback) {
				console.log(stolpersteinImport);
				
				// Check if stolperstein exists
				models.stolperstein.Stolperstein.findExactMatch(source, stolpersteinImport, function(err, stolperstein) {
					if (stolperstein) {
						console.log("found: " + stolperstein._id);
					} else {
						console.log("not found");
					}
					callback(err);
				});
			}, function(err) {
			    callback(err, newImport);
			});
		},
		// Store import data
		function(newImport, callback) {
			newImport.save(function(err, newImport) {
				callback(err, newImport);
			});
		}
	], function (err, newImport) {
		if (!err) {
			res.send(201, newImport);
		} else {
			res.send(400, err);
		}
	});
}

exports.retrieveImports = function(req, res) {
	models.import.Import.find(null, null, {lean: true}, function(err, stolpersteine) {
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