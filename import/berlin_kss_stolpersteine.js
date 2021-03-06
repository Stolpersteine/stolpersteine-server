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
	parseXml = require('xml2js').parseString,
	util = require('util');

var apiClient = restify.createJsonClient({
	version: '*',
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
	url: 'http://api.stolpersteineapp.org'
//	url: 'http://127.0.0.1:3000'
});

var kssClient = restify.createStringClient({
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; stolpersteine@option-u.com)',
	url: 'http://www.stolpersteine-berlin.de/st_interface/xml/geo/linked'
});

var source = {
	url: 'http://www.stolpersteine-berlin.de',
	name: "Koordinierungsstelle Stolpersteine Berlin",
	retrievedAt : new Date()
};

// Request data
console.log('Loading source data...');
kssClient.get('', function(error, request, response, data) {
	console.log('Loading source data done');
  	if (error) {
    	console.log('Error while loading source data');
		return;
  	}

	// Parse XML
	console.log('Parsing source data...');
	parseXml(data, function (error, result) {
		console.log('Parsing source data done');
		if (error) {
			console.log('Error when parsing source data');
			return;
		}

		// Process marker tags
		console.log('Found ' + result.markers.$.cnt + ' stolpersteine in ' + result.markers.marker.length + ' markers');
		var stolpersteine = [];
		var markers = result.markers.marker;
		// markers = markers.slice(0, 2); // restrict test data
		for (var markerIndex = 0; markerIndex < markers.length; markerIndex++) {
			var marker = markers[markerIndex];

			// Skip markers with missing geographic coordinates
			if (marker.$.lat === "" || marker.$.lng === "") {
				console.log("Skipping invalid lat/long: " + marker.$.lat + " " + marker.$.lng);
				continue;
			}

			// Convert address
			var location = {
				street : marker.$.adresse,
				zipCode : marker.$.plz,
				city : "Berlin",
				sublocality1 : marker.$.bezirk,
				sublocality2 : marker.$.ortsteil === null ? undefined : marker.$.ortsteil,
				state : "Berlin",
				coordinates : {
					longitude: marker.$.lng,
					latitude: marker.$.lat
				}
			};

			// Convert person tags
			for (var i = 0; i < marker.person.length; i++) {
				var person = marker.person[i];

				if (person.$.nachname === "") {
					console.log("Skipping invalid last name: " + person.$.nachname);
					continue;
				}

				var stolperstein = convertStolperstein(person, location, source);
				stolpersteine.push(stolperstein);
				// console.log(JSON.stringify(stolperstein));
			}
		}
		console.log('Converted ' + stolpersteine.length + ' stolperstein(e)');

		var importData = {
			source: source,
			stolpersteine: stolpersteine
		};
		console.log('Importing ' + stolpersteine.length + ' stolperstein(e)...');
//		console.log(util.inspect(importData, false, null));
		apiClient.post('/v1/imports', importData, function(err, request, response, data) {
			console.log('Resulting import data:');
			console.log(util.inspect(data, false, null));
			if (err) {
				console.log('Error during import (' + err + ')');
			} else {
				console.log(data.deleteActions.targetIds.length + ' delete action(s), ' + data.createActions.stolpersteine.length + ' create action(s)');
				console.log('Import command: curl -v -d "" ' + apiClient.url.href + 'v1/imports/' + data.id + '/execute')
				console.log('Done.')
			}
			process.exit();
		});
	});
});

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
