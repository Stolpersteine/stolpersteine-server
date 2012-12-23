var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
	name: {
		first: { type: String, required: true },
		last: { type: String, required: true }
	},
	location: {
		street: { type: String, required: true },
		zipCode: { type: String },
		city: { type: String },
		coordinates: {
			longitude: { type: Number },
			latitude: { type: Number }
		},
	},
	description: { type: String },
	image: { type: Buffer },
	createdAt: { type: Date },
	updatedAt: { type: Date }
});

// Verlegedatum
// Sources

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