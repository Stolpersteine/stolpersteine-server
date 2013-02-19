var mongoose = require('mongoose'),
	async = require('async'),
	models = require('../models');

var schema = new mongoose.Schema({
	executedAt: { type: Date },
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

schema.virtual('id').get(function(){
    return this._id;
});

schema.set('toJSON', { transform: function (doc, ret, options) {
	ret.id = doc._id;
  delete ret._id;
	delete ret.__v;
}});

schema.statics.findAndDelete = function(source, callback) {
	models.import.Import.find({"source.url": source.url}, function(err, oldImports) {
		async.forEach(oldImports, function(oldImport, callback) {
			console.log('Remove import ' + oldImport._id);
			oldImport.remove(callback);
		}, callback);
	});
}

schema.statics.findMostRecentExecutedDate = function(callback) {
	models.import.Import.findOne().select('executedAt -_id').sort({executedAt : -1}).exec(function(err, mostRecentImport) {
		callback(mostRecentImport === null ? undefined : mostRecentImport.executedAt);
	});
}

exports.Import = mongoose.model('Import', schema);