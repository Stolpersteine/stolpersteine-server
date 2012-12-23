var models = require('../models')

exports.createStolperstein = function(req, res) {
	res.send();
}

exports.retrieveStolpersteine = function(req, res) {
//	var stein = new models.Stolperstein({name: { first: "First", last: "Last" }, location: { street: "Street" } });
//	stein.save();
 	
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

exports.updateStolpersteine = function(req, res) {
	res.send();
}

exports.retrieveStolperstein = function(req, res) {
	models.Stolperstein.findById(req.params.id, { __v: 0 }, null, function(err, stolpersteine) {
		if (!err) {
			res.send(stolpersteine);
		} else {
			res.send(400, err);
		}
	});
}

exports.updateStolpersteine = function(req, res) {
	res.send();
}

exports.deleteStolperstein = function(req, res) {
	res.send();
}