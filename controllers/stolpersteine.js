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
}

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
			var regex = new RegExp('^' + req.query.q, "i");
			queries.push({
				$or: [
					{ "person.name": new RegExp('\\b' + req.query.q, "i") },
					{ "location.street": regex },
					{ "location.sublocality1": regex },
					{ "location.zipCode": regex }
				]
			});
		}

		if (typeof req.query.street !== 'undefined') {
			queries.push({
				"location.street": new RegExp('^' + req.query.street, "i")
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
		};
	
		// Pagination
		var limit = req.query.limit || 10;
		var skip = req.query.offset || 0;

		// Stringify shortcut
		var stringify;
		if (res.app.get('env') === 'development') {
			var replacer = res.app.get('json replacer') || null;
			var spaces = res.app.get('json spaces') || null;
			stringify = function(stolperstein) {
				return JSON.stringify(stolperstein, replacer, spaces)
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
}

exports.retrieveStolperstein = function(req, res) {
	models.stolperstein.Stolperstein.findById(req.params.id, function(err, stolperstein) {
		if (!err && stolperstein) {
			res.send(stolperstein);
		} else {
			res.send(404, err);
		}
	});
}

exports.deleteStolperstein = function(req, res) {
	models.stolperstein.Stolperstein.findByIdAndRemove(req.params.id, function(err, stolperstein) {
		if (!err && stolperstein) {
			res.send(204);
		} else {
			res.send(404, err);
		}
	});
}