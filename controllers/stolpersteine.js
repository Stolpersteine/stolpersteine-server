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
	
	res.write('[');
	var stream = models.stolperstein.Stolperstein.find(query).select('-__v').lean().stream();
	stream.on('data', function(stolperstein) {
		stolperstein.id = stolperstein._id;
		delete stolperstein._id;
		
		res.write(stringify(stolperstein));
		res.write(',');
	}).on('err', function(err) {
		res.write(']');
		res.end();
	}).on('close', function() {
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