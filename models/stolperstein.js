var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Schema = new Schema({
	title: { type: String, required: true },
	description: { type: String }
});

exports.Stolperstein = mongoose.model('Stolperstein', Schema, 'stolpersteine');