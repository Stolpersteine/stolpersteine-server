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

	// Use lean option and streaming to improve speed
	res.type('application/json');
	var stream = models.stolperstein.Stolperstein.find(query).select('-__v').lean().batchSize(1).stream();
	stream.on('data', function(doc) {
		res.write(JSON.stringify(doc));
	}).on('err', function(err) {
		res.end();
	}).on('close', function() {
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