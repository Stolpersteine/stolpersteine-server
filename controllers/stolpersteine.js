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

	console.time('t1');	
	models.stolperstein.Stolperstein.find(query).lean().exec(function(err, stolpersteine) {
		console.timeEnd('t1');
		console.time('t2');	
		if (!err) {
			res.send(stolpersteine);
		} else {
			res.send(400, err);
		}
		console.timeEnd('t2');
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