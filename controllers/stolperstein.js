var models = require('../models')

exports.getStolperstein = function(req, res) {
	models.Stolperstein.findOne(function(err, stolpersteine) {
		res.send(stolpersteine);
	});
}

exports.getStolpersteine = function(req, res) {
	models.Stolperstein.find(function(err, stolpersteine) {
		res.send(stolpersteine);
	});
}
