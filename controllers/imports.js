// Copyright (C) 2013 Option-U Software
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

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
						newStolperstein.updateHash();
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
