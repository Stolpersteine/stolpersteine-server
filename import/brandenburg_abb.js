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

var restify = require('restify'),
	csv = require('csv'),
	util = require('util');
	
var apiClient = restify.createJsonClient({
	version: '*',
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
//	url: 'https://stolpersteine-api.eu01.aws.af.cm'
	url: 'http://127.0.0.1:3000'
});

var kssClient = restify.createStringClient({
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; stolpersteine@option-u.com)',
	url: 'http://www.aktionsbuendnis-brandenburg.de/aktionen-positionen/stolpersteine_export.csv'
});
var source = { 
	url: 'http://www.aktionsbuendnis-brandenburg.de',
	name: "Aktionsbündnis Brandenburg"
};

// Request data
console.log('Loading source data...');
kssClient.get('', function(error, request, response, data) {
	console.log('Loading source data done');
 	if (error) {
   	console.log('Error while loading source data');
		return;
 	}

	
	csv()
	.from(data)
	.on('record', function(row, index) {
		if (index == 0) {
			return;	// column names
		} else if (index > 1) {
			return;
		}
		
	  console.log('#' + index + ' ' + JSON.stringify(row));
		var stolperstein = {
			type : "stolperstein",
			location : {}
		};
		stolperstein.location.coordinates = convertCoordinates(row[0]);
		console.log(stolperstein);
	})
	.on('end', function(count) {
	  console.log('Number of lines: ' + count);
		process.exit();
	})
	.on('error', function(error) {
	  console.log(error.message);
		process.exit();
	});
});

function convertCoordinates(row) {
	var coordinates = row.match(/\(([0-9. ]+?)\)/)[0];
	coordinates = coordinates.replace(/^\(/, "");
	coordinates = coordinates.replace(/\)$/, "");
	coordinates = coordinates.split(" ");
	
	return {
		longitude : coordinates[0],
		latitude : coordinates[1]
	};
}

function convertStolperstein(person, location, source) {
	var stolperstein = {
		type : "stolperstein",
		person : {
			firstName : person.$.vorname,
			lastName : person.$.nachname,
			biographyUrl : person.$.url
		},
		location : location,
		source : source
	};
	
	return patchStolperstein(stolperstein);
}

function patchStolperstein(stolperstein) {
	if (stolperstein.person.firstName === "Kaufhaus Nathan Israel") {
		stolperstein.person.firstName = "Kaufhaus Nathan";
		stolperstein.person.lastName = "Israel";
	}

	// Normalize abbreviated street
	stolperstein.location.street = stolperstein.location.street.replace(/str\./g, "straße");
	stolperstein.location.street = stolperstein.location.street.replace(/Str\./g, "Straße");

	// Normalize white space between street and number
	stolperstein.location.street = stolperstein.location.street.replace(/traße(\d+)/g, "traße $1");
	stolperstein.location.street = stolperstein.location.street.replace(/traße\s+(\d+)/g, "traße $1");

	return stolperstein;
}