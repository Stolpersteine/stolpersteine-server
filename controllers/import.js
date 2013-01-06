var models = require('../models')

exports.createImport = function(req, res) {
	console.log(req.body);
//	var stolperstein = new models.StolpersteinImport(req.body);
//	stolperstein.save(function(err, stolperstein) {
//		if (!err) {
//			res.send(201, stolperstein);
//		} else {
//			res.send(400, err);
//		}
//	});
	models.StolpersteinImport.find(function(err, stolpersteine) {
		if (!err) {
			res.send(201, stolpersteine);
		} else {
			res.send(400, err);
		}
	});
}
