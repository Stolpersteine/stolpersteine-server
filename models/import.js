var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	source: {
		url: { type: String, required: true, trim: true },
		name: { type: String, required: true, trim: true },
		retrievedAt: { type: Date, required: true }
	},
	actions: [{
		action: { type: String, enum: ["create", "update", "delete"] },
		sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' },
		targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' }
	}]
});

exports.Import = mongoose.model('Import', schema);