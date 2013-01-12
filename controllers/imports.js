var models = require('../models'),
	async = require('async');

exports.createImport = function(req, res) {
	var source = req.body.source;
	var stolpersteineImport = req.body.stolpersteine;
	
	async.waterfall([
		// Find and delete old imports
		models.import.Import.findAndDelete.bind(undefined, source),
		
		// Figure out existing stolpersteine
		function(callback) {
			var existingStolpersteineIds = new Array();
			var newImport = new models.import.Import();
			newImport.source = source;
			
			async.forEach(stolpersteineImport, function(stolpersteinImport, callback) {
				// Check if stolperstein exists
				models.stolperstein.Stolperstein.findExactMatch(source, stolpersteinImport, function(err, stolperstein) {
					if (stolperstein) {
						existingStolpersteineIds.push(stolperstein._id);
						console.log("Found stolperstein " + stolperstein._id);
					} else {
						var newStolperstein = new models.stolperstein.Stolperstein(stolpersteinImport);
						newStolperstein.source = source;
						newImport.createActions.stolpersteine.push(newStolperstein);
						console.log("Stolperstein not found");
					}
					callback(err);
				});
			}, function(err) {
			    callback(err, newImport, existingStolpersteineIds);
			});
		},
		// Stolpersteine that don't exist any more
		function(newImport, existingStolpersteineIds, callback) {
				models.stolperstein.Stolperstein.find({_id: {$nin: existingStolpersteineIds}}, function(err, stolpersteine) {
					async.forEach(stolpersteine, function(stolperstein, callback) {
						console.log('Remove stolperstein ' + stolperstein._id);
						stolperstein.remove(function(err) {
							callback(err, newImport);
						});
					}, function(err) {
					    callback(err, newImport);
					});
				});
		},
		// Store import data
		function(newImport, callback) {
			newImport.save(function(err, newImport) {
				console.log('Created import ' + newImport._id);
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