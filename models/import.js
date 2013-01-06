var mongoose = require('mongoose');
var models = require('../models');

var schema = new mongoose.Schema({
	source: {
		url: { type: String, required: true, trim: true },
		name: { type: String, required: true, trim: true },
		retrievedAt: { type: Date, required: true }
	},
	actions: [{
		action: { type: String, enum: ["create", "update", "delete"] },
		targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' },
		sourceData: [models.stolperstein.StolpersteinSchema]
	}]
});

exports.Import = mongoose.model('Import', schema);