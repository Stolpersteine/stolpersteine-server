var models = require('../models')

exports.getStolperstein = function(req, res) {
	models.Stolperstein.findById(req.params.id, { __v: 0 }, null, function(err, stolpersteine) {
		res.send(stolpersteine);
	});
}

exports.getStolpersteine = function(req, res) {
	models.Stolperstein.find(null, { __v: 0 }, null, function(err, stolpersteine) {
		res.send(stolpersteine);
	});
}
