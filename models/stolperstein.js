var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
	person: {
		name: { type: String, required: true }
	},
	location: {
		street: { type: String, required: true },
		zipCode: { type: String, required: true },
		city: { type: String, required: true },
		coordinates: {
			longitude: { type: Number, required: true },
			latitude: { type: Number, required: true }
		},
	},
	laidAt : { 
		year: { type: String, required: true },
		month: { type: String },
		date: { type: String }
	},
	description: { type: String },
	image: { type: Buffer },
	sources: [{
		url: { type: String },
		description: { type: String },
		retrievedAt: { type: Date }
	}],
	createdAt: { type: Date },
	updatedAt: { type: Date }
});

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