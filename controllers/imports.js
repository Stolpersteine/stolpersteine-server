"use strict";

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
			var existingStolpersteineIds = [];
			var newImport = new models.import.Import();
			newImport.source = source;
			
			async.forEach(stolpersteineImport, function(stolpersteinImport, callback) {
				// Check if stolperstein exists
				models.stolperstein.Stolperstein.findExactMatch(source, stolpersteinImport, function(err, stolperstein) {
					if (stolperstein) {
						existingStolpersteineIds.push(stolperstein.id);
					} else {
						var newStolperstein = new models.stolperstein.Stolperstein(stolpersteinImport);
						newStolperstein.source = source;
						newImport.createActions.stolpersteine.push(newStolperstein);
					}
					callback(err);
				});
			}, function(err) {
				callback(err, newImport, existingStolpersteineIds);
			});
		},
		// Stolpersteine that don't exist any more
		function(newImport, existingStolpersteineIds, callback) {
				models.stolperstein.Stolperstein.find({"source.url": source.url, "_id": {$nin: existingStolpersteineIds}}, function(err, stolpersteine) {
					async.forEach(stolpersteine, function(stolperstein, callback) {
						newImport.deleteActions.targetIds.push(stolperstein.id);
						callback(null, newImport);
					}, function(err) {
						callback(err, newImport);
					});
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
};

exports.retrieveImports = function(req, res) {
	models.import.Import.find(function(err, imports) {
		if (!err) {
			res.send(imports);
		} else {
			res.send(400, err);
		}
	});
};

exports.retrieveImport = function(req, res) {
	models.import.Import.findById(req.params.id, function(err, importData) {
		if (!err && importData) {
			res.send(importData);
		} else {
			res.send(404, err);
		}
	});
};

exports.deleteImport = function(req, res) {
	models.import.Import.findByIdAndRemove(req.params.id, function(err, importData) {
		if (!err && importData) {
			res.send(204);
		} else {
			res.send(404, err);
		}
	});
};

exports.executeImport = function(req, res) {
	models.import.Import.findById(req.params.id, function(err, importData) {
		if (!err && importData) {
			async.parallel([
				function(callback) {
					async.forEach(importData.createActions.stolpersteine, function(stolperstein, callback) {
						stolperstein = new models.stolperstein.Stolperstein(stolperstein);
						stolperstein.source = importData.source;
						stolperstein.save(callback);
					}, callback);
				},
				function(callback) {
					async.forEach(importData.deleteActions.targetIds, function(targetId, callback) {
						models.stolperstein.Stolperstein.findByIdAndRemove(targetId, callback);
					}, callback);
				}
			],
			function(err, results) {
				importData.executedAt = new Date();
				importData.save();
				res.send(201, importData);
			});
		} else {
			res.send(404, err);
		}
	});
};