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
	var query = {};
	if (typeof req.query.q !== 'undefined') {
		var regex = new RegExp('^' + req.query.q, "i");
		query = {
			$or: [
				{"person.lastName": regex},
				{"person.firstName": regex},
				{"location.street": regex},
				{"location.zipCode": regex}
			]
		};
	}

	if (typeof req.query.street !== 'undefined') {
		var regex = new RegExp('^' + req.query.street, "i");
		query = {
			"location.street": regex
		};
	}

	// Manual streaming to improve speed
	res.type('application/json');
	var stream = models.stolperstein.Stolperstein.find(query).select('-__v').lean().stream();
	var hasWritten = false;
	stream.on('data', function(stolperstein) {
	  if (!hasWritten) {
	    hasWritten = true;
			res.write('[');
		} else {
			res.write(',');
		}
		
		stolperstein.id = stolperstein._id;
		delete stolperstein._id;
		
		var replacer = res.app.get('json replacer') || null;
		var spaces = res.app.get('json spaces') || null;
		res.write(JSON.stringify(stolperstein, replacer, spaces));
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