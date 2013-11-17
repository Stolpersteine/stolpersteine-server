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

var models = require('../models');

exports.createStolperstein = function(req, res) {
	var stolperstein = new models.stolperstein.Stolperstein(req.body);
	stolperstein.save(function(err, stolperstein) {
		if (!err) {
			res.send(201, stolperstein);
		} else {
			res.send(400, err);
		}
	});
};

exports.retrieveStolpersteine = function(req, res) {
	models.stolperstein.Stolperstein.findMostRecentId(function(mostRecentId) {
		// Cache validation
		if (mostRecentId) {
			var etag = '"' + mostRecentId + '"';
			var match = req.get('If-None-Match');
			if (etag === match) {
				res.send(304);
				return;
			}
			res.setHeader('ETag', etag);
		}
	
		// Queries
		var queries = [];
		if (typeof req.query.q !== 'undefined') {
			var keywords = req.query.q.split(" ");
			for (var i = 0; i < keywords.length; i++) {
				var regex = new RegExp('^' + keywords[i], "i");
				queries.push({
					$or: [
						{ "person.firstName": regex },
						{ "person.lastName": regex },
						{ "location.street": regex },
						{ "location.sublocality1": regex },
						{ "location.zipCode": regex }
					]
				});
			}
		}

		if (typeof req.query.street !== 'undefined') {
			queries.push({
				"location.street": new RegExp('^' + req.query.street, "i")
			});
		}

		if (typeof req.query.city !== 'undefined') {
			queries.push({
				"location.city": new RegExp('^' + req.query.city, "i")
			});
		}

		if (typeof req.query.state !== 'undefined') {
			queries.push({
				"location.state": new RegExp('^' + req.query.state, "i")
			});
		}

		if (typeof req.query.source !== 'undefined') {
			queries.push({
				"source.name": new RegExp('^' + req.query.source, "i")
			});
		}
		
		var query = {};
		if (queries.length >= 1) {
			query = {
				$and : queries
			};
		}
		
		console.log(query);
	
		// Pagination
		var limit = req.query.limit || 10;
		var skip = req.query.offset || 0;

		// Stringify shortcut
		var stringify;
		if (res.app.get('env') === 'development') {
			var replacer = res.app.get('json replacer') || null;
			var spaces = res.app.get('json spaces') || null;
			stringify = function(stolperstein) {
				return JSON.stringify(stolperstein, replacer, spaces);
			};
		} else {
			stringify = JSON.stringify;
		}
	
		// Manual streaming to improve speed
		res.charset = 'utf-8';
		res.type('application/json');
		var stream = models.stolperstein.Stolperstein.find(query)
																									.select('-__v')
																									.limit(limit)
																									.skip(skip)
																									.lean()
																									.stream();
		var hasWritten = false;
		stream.on('data', function(stolperstein) {
			stolperstein.id = stolperstein._id;
			delete stolperstein._id;
		
			if (!hasWritten) {
				hasWritten = true;
				res.write('[');
			} else {
				res.write(',');
			}		
		
			res.write(stringify(stolperstein));
		}).on('err', function(err) {
			if (!hasWritten) {
				res.write('[');
			}
			res.write(']');
			res.end();
		}).on('close', function() {
			if (!hasWritten) {
				res.write('[');
			}
			res.write(']');
			res.end();
		});
	});
};

exports.retrieveStolperstein = function(req, res) {
	models.stolperstein.Stolperstein.findById(req.params.id, function(err, stolperstein) {
		if (!err && stolperstein) {
			res.send(stolperstein);
		} else {
			res.send(404, err);
		}
	});
};

exports.deleteStolperstein = function(req, res) {
	models.stolperstein.Stolperstein.findByIdAndRemove(req.params.id, function(err, stolperstein) {
		if (!err && stolperstein) {
			res.send(204);
		} else {
			res.send(404, err);
		}
	});
};