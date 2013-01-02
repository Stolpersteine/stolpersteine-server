var models = require('../models')

exports.createStolperstein = function(req, res) {
	var stolperstein = new models.Stolperstein(req.body);
	stolperstein.save(function(err, stolperstein) {
		if (!err) {
			res.send(201, stolperstein);
		} else {
			res.send(400, err);
		}
	});
}

exports.retrieveStolpersteine = function(req, res) {
	models.Stolperstein.find(function(err, stolpersteine) {
		if (!err) {
			// Convert to GeoJSON format
//			for (var i = 0; i < stolpersteine.length; i++) {
//				stolpersteine[i] = stolpersteine[i].convertToGeoJSON();
//			};
			res.send(stolpersteine);
		} else {
			res.send(400, err);
		}
	});
}

exports.retrieveStolperstein = function(req, res) {
	models.Stolperstein.findById(req.params.id, { __v: 0 }, null, function(err, stolperstein) {
		if (!err && stolperstein) {
			res.send(stolperstein);
		} else {
			res.send(404, err);
		}
	});
}

exports.deleteStolperstein = function(req, res) {
	models.Stolperstein.findByIdAndRemove(req.params.id, { __v: 0 }, function(err, stolperstein) {
		if (!err) {
			res.send(204);
		} else {
			res.send(404, err);
		}
	});
}