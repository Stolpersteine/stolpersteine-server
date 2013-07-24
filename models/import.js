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
		targetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stolperstein' }]
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
			oldImport.remove(callback);
		}, callback);
	});
};

exports.Import = mongoose.model('Import', schema);