var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Schema = new Schema({
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
	image: { type: Buffer }
});

// Verlegedatum
// creation date
// modification date
// Sources

exports.Stolperstein = mongoose.model('Stolperstein', Schema, 'stolpersteine');