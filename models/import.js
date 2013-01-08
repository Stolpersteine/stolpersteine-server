var mongoose = require('mongoose');
var models = require('../models');

var schema = new mongoose.Schema({
	source: {
		url: { type: String, required: true, trim: true },
		name: { type: String, required: true, trim: true },
		retrievedAt: { type: Date, required: true }
	},
	createActions: {
		stolpersteine: [models.stolperstein.StolpersteinSchema]
	},
	updateActions: {
		targetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' }],
		stolpersteine: [models.stolperstein.StolpersteinSchema]
	},
	deleteActions: [{
		targetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' }],
	}]
});

exports.Import = mongoose.model('Import', schema);