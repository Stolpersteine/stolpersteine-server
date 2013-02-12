var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	person: {
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String/*, required: true*/, trim: true }
	},
	location: {
		street: { type: String, required: true, trim: true },
		zipCode: { type: String/*, required: true*/, trim: true },
		city: { type: String, required: true, trim: true },
		sublocality1: { type: String, trim: true },
		sublocality2: { type: String, trim: true },
		coordinates: {
			longitude: { type: Number, required: true },
			latitude: { type: Number, required: true }
		},
	},
	laidAt : { 
		year: { type: Number, min: 1992 },
		month: { type: Number, min: 0, max: 11 },
		date: { type: Number, min: 0, max: 31 }
	},
	description: { type: String, trim: true },
	imageUrl: { type: String, trim: true },
	source: {
		url: { type: String, trim: true, required: true },
		name: { type: String, trim: true, required: true },
		retrievedAt: { type: Date, required: true }
	},
	createdAt: { type: Date },
	updatedAt: { type: Date }
});

schema.virtual('id').get(function(){
    return this._id;
});

schema.set('toJSON', { transform: function (doc, ret, options) {
	ret.id = doc._id;
  delete ret._id;
	delete ret.__v;
}});

schema.methods.toGeoJSON = function() {
	return { 
		"type": "Feature", 
		"geometry": {
			"type": "Point", 
			"coordinates": [this.location.longitude, this.location.latitude]
		}
	};
}

schema.statics.findExactMatch = function(source, stolperstein, callback) {
	this.findOne({
		"source.url": source.url, 
		"source.name": source.name, 
//		"source.retrievedAt": source.retrievedAt, 
		"person.firstName": stolperstein.person.firstName,
		"person.lastName": stolperstein.person.lastName,
		"location.street": stolperstein.location.street,
		"location.city": stolperstein.location.city,
		"location.zipCode": stolperstein.location.zipCode,
		"location.coordinates.latitude": stolperstein.location.coordinates.latitude,
		"location.coordinates.longitude": stolperstein.location.coordinates.longitude,
		"description": stolperstein.description
	}, callback);
}

// Automatically maintain created and updated dates
schema.pre('save', function (next) {
	// This overwrites model data for createdAt and updatedAt
	if (this.isNew) {
		this.createdAt = this.updatedAt = new Date;
	} else {
		this.updatedAt = new Date;
	}
	next();
});

exports.Stolperstein = mongoose.model('Stolperstein', schema, 'stolpersteine');
exports.StolpersteinSchema = schema;