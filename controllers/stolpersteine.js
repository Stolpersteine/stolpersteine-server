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
		query = {
			"person.firstName": new RegExp('^' + req.query.q + '*', "i")
		};
	}
	
	models.stolperstein.Stolperstein.find(query, function(err, stolpersteine) {
		if (!err) {
			// Convert to GeoJSON format
//			for (var i = 0; i < stolpersteine.length; i++) {
//				stolpersteine[i] = stolpersteine[i].toGeoJSON();
//			};
			res.send(stolpersteine);
		} else {
			res.send(400, err);
		}
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