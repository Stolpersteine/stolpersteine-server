"use strict";

var mongoose = require('mongoose'),
	crypto = require('crypto');

var schema = new mongoose.Schema({
	person: {
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String, required: true, trim: true },
		biographyUrl: { type: String, trim: true }
	},
	location: {
		street: { type: String, required: true, trim: true },
		zipCode: { type: String, trim: true },
		city: { type: String, required: true, trim: true },
		sublocality1: { type: String, trim: true },
		sublocality2: { type: String, trim: true },
		coordinates: {
			longitude: { type: Number, required: true },
			latitude: { type: Number, required: true }
		}
	},
	source: {
		url: { type: String, trim: true, required: true },
		name: { type: String, trim: true, required: true },
		retrievedAt: { type: Date, required: true }
	},
	description: { type: String, trim: true },
	hash: { type: String, trim: true }
});

schema.virtual('id').get(function() {
    return this._id;
});

schema.set('toJSON', { transform: function (doc, ret, options) {
	ret.id = doc._id;
  delete ret._id;
	delete ret.__v;
	delete ret.hash;
}});

schema.methods.toGeoJSON = function() {
	return { 
		"type": "Feature", 
		"geometry": {
			"type": "Point", 
			"coordinates": [this.location.longitude, this.location.latitude]
		}
	};
};

schema.statics.createHash = function(stolperstein) {
	var hash = crypto.createHash("md5");
	hash.update(stolperstein.source.url === undefined ? "" : stolperstein.source.url.trim());
	hash.update(stolperstein.source.name === undefined ? "" : stolperstein.source.name.trim());
	hash.update(stolperstein.person.firstName === undefined ? "" : stolperstein.person.firstName.trim());
	hash.update(stolperstein.person.lastName === undefined ? "" : stolperstein.person.lastName.trim());
	hash.update(stolperstein.person.biographyUrl === undefined ? "" : stolperstein.person.biographyUrl.trim());
	hash.update(stolperstein.location.street === undefined ? "" : stolperstein.location.street.trim());
	hash.update(stolperstein.location.zipCode === undefined ? "" : stolperstein.location.zipCode.trim());
	hash.update(stolperstein.location.city === undefined ? "" : stolperstein.location.city.trim());
	hash.update(stolperstein.location.sublocality1 === undefined ? "" : stolperstein.location.sublocality1.trim());
	hash.update(stolperstein.location.sublocality2 === undefined ? "" : stolperstein.location.sublocality2.trim());
	hash.update(stolperstein.location.coordinates.latitude === undefined ? "" : '' + parseFloat(stolperstein.location.coordinates.latitude));
	hash.update(stolperstein.location.coordinates.longitude === undefined ? "" : '' + parseFloat(stolperstein.location.coordinates.longitude));
	hash.update(stolperstein.description === undefined ? "" : stolperstein.description.trim());
	
	return hash.digest('hex');
};

schema.pre('save', function (next) {
	if (this.isNew) {
		this.hash = exports.Stolperstein.createHash(this);
	}
	next();
});

schema.statics.findExactMatch = function(source, stolperstein, callback) {
	stolperstein.source = source;
	var hash = exports.Stolperstein.createHash(stolperstein);
	this.findOne({ hash: hash	}, callback);
};

schema.statics.findMostRecentId = function(callback) {
	this.findOne().select().sort({_id : -1}).exec(function(err, mostRecent) {
		callback(mostRecent === null ? undefined : mostRecent.id);
	});
};

exports.Stolperstein = mongoose.model('Stolperstein', schema, 'stolpersteine');
exports.StolpersteinSchema = schema;