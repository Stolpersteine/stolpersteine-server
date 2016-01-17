// Copyright (C) 2013 Option-U Software
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

"use strict";

var mongoose = require('mongoose'),
	crypto = require('crypto');

var schema = new mongoose.Schema({
	hash: { type: String, required: true, index: true },
	type: { type: String, enum: ['stolperstein', 'stolperschwelle'], required: true },
	createdAt: { type: Date },
	updatedAt: { type: Date },
	person: {
		firstName: { type: String, trim: true },
		lastName: { type: String, required: true, trim: true },
		biographyUrl: { type: String, trim: true }
	},
	location: {
		street: { type: String, required: true, trim: true },
		zipCode: { type: String, trim: true },
		city: { type: String, required: true, trim: true },
		sublocality1: { type: String, trim: true },
		sublocality2: { type: String, trim: true },
		state: { type: String, required: true, trim: true },
		coordinates: {
			longitude: { type: Number, required: true },
			latitude: { type: Number, required: true }
		}
	},
	description: { type: String, trim: true },
	source: {
		url: { type: String, trim: true, required: true },
		name: { type: String, trim: true, required: true },
		retrievedAt: { type: Date, required: true }
	}
});

schema.virtual('id').get(function() {
    return this._id;
});

schema.pre('save', function(next) {
	var now = new Date();
	this.updatedAt = now;
	if (!this.createdAt) {
		this.createdAt = now;
	}
	next();
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

schema.methods.updateHash = function() {
	var hash = crypto.createHash('sha1')

	hash.update(this.source.url ? this.source.url.trim() : "")
	hash.update(this.source.name ? this.source.name.trim() : "")
	hash.update(this.type ? this.type.trim() : "")
	hash.update(this.person.firstName ? this.person.firstName.trim() : "")
	hash.update(this.person.lastName ? this.person.lastName.trim() : "")
	hash.update(this.person.biographyUrl ? this.person.biographyUrl.trim() : "")
	hash.update(this.location.street ? this.location.street.trim() : "")
	hash.update(this.location.zipCode ? this.location.zipCode.trim() : "")
	hash.update(this.location.city ? this.location.city.trim() : "")
	hash.update(this.location.sublocality1 ? this.location.sublocality1.trim() : "")
	hash.update(this.location.sublocality2 ? this.location.sublocality2.trim() : "")
	hash.update(this.location.state ? this.location.state.trim() : "")
	hash.update(this.location.coordinates.latitude ? "" + this.location.coordinates.latitude : "")
	hash.update(this.location.coordinates.longitude ? "" + this.location.coordinates.longitude : "")
	hash.update(this.description ? this.description.trim() : "")

	// not hashed: retrievedAt

	this.hash = hash.digest('hex');
};

schema.statics.findExactMatch = function(stolperstein, callback) {
	this.findOne({
		"hash": stolperstein.hash
	}, callback);
};

schema.statics.findMostRecentId = function(callback) {
	this.findOne().select().sort({_id : -1}).exec(function(err, mostRecent) {
		callback(mostRecent === null ? undefined : mostRecent.id);
	});
};

exports.Stolperstein = mongoose.model('Stolperstein', schema, 'stolpersteine');
exports.StolpersteinSchema = schema;
