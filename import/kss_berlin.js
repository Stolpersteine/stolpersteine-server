var request = require('request'),
	url = require('url'),
	parseXml = require('xml2js').parseString;
	async = require('async');
	
var uriSource = url.parse('http://www.stolpersteine-berlin.de/st_interface/xml/geo/linked');
//var urlApi = 'http://127.0.0.1:3000/api';
var urlApi = 'https://stolpersteine-optionu.rhcloud.com/api';
var userAgent = 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)';

var source = { 
	url: uriSource.href,
	name: "Koordinierungsstelle Stolpersteine Berlin"
}

// Request data
console.log('Loading source data...');
request({ uri:uriSource, headers: {'user-agent' : userAgent } }, function(error, response, body) {
	console.log('Loading source data done');
  if (error) {
    console.log('Error when loading source data');
		return;
  }

	// Parse XML
	console.log('Parsing source data...');
	parseXml(body, function (err, result) {
		console.log('Parsing source data done');
	  if (error) {
	    console.log('Error when parsing source data');
			return;
	  }

		// Process marker tags
		console.log('Found ' + result.markers.$.cnt + ' stolpersteine in ' + result.markers.marker.length + ' markers');
		var stolpersteine = [];
		source.retrievedAt = 	new Date(response.headers["date"]);
		var markers = result.markers.marker;
//		markers = markers.slice(250, 260); // restrict test data
		for (var j = 0; j < markers.length; j++) {
			var marker = markers[j];
			
			var location = {
				street : marker.$.adresse,
				city : "Berlin",
				sublocality1 : marker.$.bezirk,
				sublocality2 : marker.$.ortsteil,
				coordinates : {
					longitude: marker.$.lng,
					latitude: marker.$.lat
				}
			};

			// Convert person tags
			for (var i = 0; i < marker.person.length; i++) {
				var person = marker.person[i];
				console.log('- ' + person.$.name + ' (converting...)');
				var stolperstein = convertStolperstein(person, location, source);
				stolpersteine.push(stolperstein);
				console.log('- ' + person.$.name + ' (converting done)');
			}
			
			// Convert person tags nested in 'weitere'
			if (marker.weitere) {
				console.log('Processing "weitere"');
				for (var i = 0; i < marker.weitere.length; i++) {
					location.street = marker.weitere[i].$.adresse;
				
					for (var k = 0; k < marker.weitere[i].person.length; k++) {
						var person = marker.weitere[i].person[k];
						console.log('- ' + person.$.name + ' (converting...)');
						var stolperstein = convertStolperstein(person, location, source);
						stolpersteine.push(stolperstein);
						console.log('- ' + person.$.name + ' (converting done)');
					}
				}
			}
		};
		console.log('Converted ' + stolpersteine.length + ' stolperstein(e)');
	});
});

function convertStolperstein(person, location, source) {
	return stolperstein = {
		person : {
			firstName : person.name,
			lastName : ''
		},
		location : location,
		source : source
	};
}

function patchStolperstein(stolperstein, callback) {
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (patching...)');
	
	stolperstein.location.street = stolperstein.location.street.replace("(heute Eingang U-Bahnhof Turmstraße)", "");
	stolperstein.location.street = stolperstein.location.street.replace("Spenerstraße Ecke Melanchtonstraße", "Spenerstr. 14");
	stolperstein.location.street = stolperstein.location.street.replace("Bundesratufer 1", "Bundesratufer 2");

	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (patching done)');
	callback(null, stolperstein);
}