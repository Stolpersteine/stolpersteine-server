var mongoose = require('mongoose'),
	async = require('async'),
	models = require('../models');

var schema = new mongoose.Schema({
	source: {
		url: { type: String, unique: true, required: true, trim: true },
		name: { type: String, required: true, trim: true },
		retrievedAt: { type: Date, required: true }
	},
	createActions: {
		stolpersteine: [models.stolperstein.StolpersteinSchema]
	},
	deleteActions: {
		targetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' }],
	}
});

schema.statics.findAndDelete = function(source, callback) {
	models.import.Import.find({"source.url": source.url}, function(err, oldImports) {
		async.forEach(oldImports, function(oldImport, callback) {
			console.log('Remove import ' + oldImport._id);
			oldImport.remove(callback);
		}, callback);
	});
}

exports.Import = mongoose.model('Import', schema);