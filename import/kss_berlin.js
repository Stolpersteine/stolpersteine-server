"use strict";

var restify = require('restify'),
	url = require('url'),
	parseXml = require('xml2js').parseString,
	async = require('async');
	
var apiClient = restify.createJsonClient({
	version: '*',
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
//	url: 'http://127.0.0.1:3000'
	url: 'https://stolpersteine-optionu.rhcloud.com'
});

var kssUrl = 'http://www.stolpersteine-berlin.de/st_interface/xml/geo/linked';
var kssClient = restify.createStringClient({
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
	url: kssUrl
});
var source = { 
	url: kssUrl,
	name: "Koordinierungsstelle Stolpersteine Berlin"
};

// Request data
console.log('Loading source data...');
kssClient.get('', function(error, req, res, data) {
	console.log('Loading source data done');
  if (error) {
    console.log('Error when loading source data');
		return;
  }

	// Parse XML
	console.log('Parsing source data...');
	parseXml(data, function (err, result) {
		console.log('Parsing source data done');
		if (error) {
			console.log('Error when parsing source data');
			return;
		}

		// Process marker tags
		console.log('Found ' + result.markers.$.cnt + ' stolpersteine in ' + result.markers.marker.length + ' markers');
		var stolpersteine = [];
		source.retrievedAt = new Date(res.headers.date);
		var markers = result.markers.marker;
//		markers = markers.slice(0, 100); // restrict test data
		for (var markerIndex = 0; markerIndex < markers.length; markerIndex++) {
			var marker = markers[markerIndex];
			
			var location = {
				street : marker.$.adresse,
				zipCode : marker.$.plz,
				city : "Berlin",
				sublocality1 : marker.$.bezirk,
				sublocality2 : marker.$.ortsteil === null ? undefined : marker.$.ortsteil,
				coordinates : {
					longitude: marker.$.lng,
					latitude: marker.$.lat
				}
			};

			// Convert person tags
			for (var i = 0; i < marker.person.length; i++) {
				var person = marker.person[i];
				var stolperstein = convertStolperstein(person, location, source);
				stolpersteine.push(stolperstein);
				console.log('- ' + person.$.vorname + ' ' + person.$.nachname + ' (converting done)');
			}
			
			// Convert person tags nested in 'weitere'
			if (marker.weitere) {
				console.log('Processing "weitere"');
				for (var j = 0; j < marker.weitere.length; j++) {
					location.street = marker.weitere[j].$.adresse;
				
					for (var k = 0; k < marker.weitere[j].person.length; k++) {
						var personWeitere = marker.weitere[j].person[k];
						var stolpersteinWeitere = convertStolperstein(personWeitere, location, source);
						stolpersteine.push(stolpersteinWeitere);
						console.log('- ' + person.$.vorname + ' ' + person.$.nachname + ' (converting done)');
					}
				}
			}
		}
		console.log('Converted ' + stolpersteine.length + ' stolperstein(e)');
		var importData = {
			source: source,
			stolpersteine: stolpersteine
		};
		console.log('importData = ' + importData);
		apiClient.post('/api/imports', importData, function(err, req, res, data) {
			if (err) {
				console.log('Error during import (' + err + ')');
			} else {
				console.log(data);
				console.log('Done.')
			}
		});
	});
});

function convertStolperstein(person, location, source) {
	var stolperstein = {
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
	
	stolperstein.location.street = stolperstein.location.street.replace(/str\./g, "straße");
	stolperstein.location.street = stolperstein.location.street.replace(/Str\./g, "Straße", "g");

	return stolperstein;
}