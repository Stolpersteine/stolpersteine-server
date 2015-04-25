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

// http://www.adaltas.com/projects/node-csv/

"use strict";

var request = require('request'),
	csv = require('csv'),
	iconv = require('iconv-lite'),
	util = require('util');
	
var sourceOptions = {
	url: 'http://www.bochum.de/C12571A3001D56CE/currentbaselink/W29VSB94839BOCMDE/$FILE/Stolpersteine.csv',
	encoding: null,
	headers: {
		'User-Agent': 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)'
	}
};

var apiOptions = {
	url: 'https://stolpersteine-api.eu01.aws.af.cm/v1/imports',
//	url: 'http://127.0.0.1:3000/v1/imports',
	headers: {
		'User-Agent': 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
		'Content-Type' : 'application/json'
	}
};

var source = { 
	url: "http://www.bochum.de",
	name: "Stadt Bochum",
	retrievedAt : new Date()
};

// Request data
console.log('Loading source data...');
request.get(sourceOptions, function(error, response, data) {     
	data = iconv.decode(data, "iso-8859-1");
	console.log('Loading source data done.');
 	if (error) {
   	console.log('Error while loading source data ' + error);
		return;
 	}
	
	readCsvData(data, function(error, stolpersteine) {
	 	if (error) {
	   		console.log('Error while reading CSV data ' + error);
			return;
	 	}
		
//		for (var i = 0; i < stolpersteine.length; i++) {
//			var stolperstein = stolpersteine[i];
//			console.log(stolperstein.location.city);
//		}
		// console.log(stolpersteine.length + " stolperstein(e)");

		uploadStolpersteine(stolpersteine, function(error, data) {
			console.log('Resulting import data:');
			console.log(util.inspect(data, false, null));
			
			if (error) {
				console.log('Error during import (' + error + ')');
			} else {
				console.log(data.deleteActions);
				console.log(data.deleteActions.targetIds.length + ' delete action(s), ' + data.createActions.stolpersteine.length + ' create action(s)');
				console.log('Import command: curl -v -d "" ' + apiOptions.url + "/" + data.id + '/execute')
				console.log('Done.')
			}
		});
	});
});

function readCsvData(data, callback) {
	var stolpersteine = [];
	var processingError = null;
	csv()
	.from(data)
	.from.options({trim : true, delimiter : ';'})
	.on('record', function(row, index) {
		if (index == 0) {
			return;	// column names
		}
		
		if (processingError) {
			return;	// ignore after first error
		}

		// if (index < 2) {
			row = patchCsv(row);
			console.log('#' + index + ' ' + JSON.stringify(row));

			var stolperstein = {
				type : "stolperstein"
			};
			stolperstein.person = convertPerson(row[0].trim(), row[6].trim());
			stolperstein.location = convertLocation(row[1].trim(), row[10].trim(), row[9].trim());
			
			stolperstein = patchStolperstein(stolperstein);
			
			console.log(JSON.stringify(stolperstein));
			
			stolpersteine.push(stolperstein);
		 // }
	})
	.on('end', function(count) {
		console.log('end');
		console.log('Read ' + count + ' line(s) of CSV data');
		callback(null, stolpersteine);
	})
	.on('error', function(error) {
		processingError = error;
		callback(error, null);
	});
}

function patchCsv(row) {
	return row;
}

function patchStolperstein(stolperstein) {
	// Normalize abbreviated street
	stolperstein.location.street = stolperstein.location.street.replace(/str\./g, "straße");
	stolperstein.location.street = stolperstein.location.street.replace(/Str\./g, "Straße");

	// Normalize white space between street and number
	stolperstein.location.street = stolperstein.location.street.replace(/traße(\d+)/g, "traße $1");
	stolperstein.location.street = stolperstein.location.street.replace(/traße\s+(\d+)/g, "traße $1");
	
	// Invalid character for Renée Gottschalk
	if (stolperstein.person.lastName === "Gottschalk" && stolperstein.person.firstName.lastIndexOf("Ren", 0) === 0) {
		stolperstein.person.firstName = "Renée";
	}
	
	// Invalid URLs
	if (stolperstein.person.biographyUrl === "http://www.bochum.de/C12571A3001D56CE/vwContentByKey/W28QDE65010BOLDDE/$FILE/135_138_ Familie_Pollack.pdf") {
		stolperstein.person.biographyUrl = "http://www.bochum.de/C12571A3001D56CE/vwContentByKey/W28QDE65010BOLDDE/$FILE/135_138_%20Familie_Pollack.pdf";
	}

	if (stolperstein.person.biographyUrl === "http://www.bochum.de/C12571A3001D56CE/vwContentByKey/W28DBB3C290BOLDDE/$FILE/122_123_124_125_Alexander_ Hermann_und_Familie.pdf") {
		stolperstein.person.biographyUrl = "http://www.bochum.de/C12571A3001D56CE/vwContentByKey/W28DBB3C290BOLDDE/$FILE/122_123_124_125_Alexander_%20Hermann_und_Familie.pdf";
	}

	return stolperstein;
}

function convertPerson(name, biography) {
	// "<last>, <first>, <add>", "<url>"
	var names = name.split(", ");
	var person = {
		firstName : names[1],
		lastName : names[0],
	};
	
	if (biography.length > 0) {
		person.biographyUrl = biography;
	}
	
	return person;
}

function convertLocation(street, latitude, longitude) {
	// "<street>", "<lat,lat>", "<lng,lng>"
	var parsedLatitude = latitude.replace(",", ".");
	var parsedLongitude = longitude.replace(",", ".");
	return {
		street : street,
		city : "Bochum",
		state : "Nordrhein-Westfalen",
		coordinates: {
			latitude : parsedLatitude,
			longitude : parsedLongitude
		}
	};
}

function uploadStolpersteine(stolpersteine, callback) {
	var importData = {
		source: source,
		stolpersteine: stolpersteine
	};
	
	console.log('Importing ' + stolpersteine.length + ' stolperstein(e)...');
	apiOptions.body = JSON.stringify(importData);
	request.post(apiOptions, function(error, response, data) {     
		callback(error, JSON.parse(data));
	});
}
