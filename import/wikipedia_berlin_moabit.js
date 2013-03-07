"use strict";

// Problems:
// - Alexander Fromm, Kirchstr. 7 > wrong coords
// - Wolff	Bundesratufer 1 (91, 92) -> not found
// - Marianne Peukert, Spenerstraße Ecke Melanchtonstraße -> invalid zip

var request = require('request'),
	jsdom = require('jsdom'),
	url = require('url'),
	async = require('async');
	
var uriSource = url.parse('http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Moabit');
//var urlApi = 'http://127.0.0.1:3000/api';
var urlApi = 'https://stolpersteine-optionu.rhcloud.com/api';
var userAgent = 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)';
var additionalGeoHint = ',Moabit';
var counter = 0;

request({ uri:uriSource, headers: {'user-agent' : userAgent } }, function(error, response, body) {
  if (error) {
    console.log('Error when contacting site');
		return;
  }
  
  jsdom.env({
    html: body,
    scripts: ['http://code.jquery.com/jquery-1.7.min.js']
  }, function (err, window) {
		var stolpersteine = [];
		
		var source = { 
			url: uriSource.href,
			name: "Wikipedia",
			retrievedAt: new Date(response.headers.date)
		};
		
		var $ = window.jQuery;
		var tableRows = $('table.wikitable.sortable tr');
		tableRows = tableRows.slice(1, tableRows.length); // first item is table header row
		console.log('num table rows: ' + tableRows.length);
//		tableRows = tableRows.slice(91, 92);	// restrict test data
		async.forEachLimit(tableRows, 1, function(tableRow, callback) {
			async.waterfall([
				convertStolperstein.bind(undefined, $, tableRow),
				patchStolperstein,
				addSourceToStolperstein.bind(undefined, source),
				geocodeStolperstein
			], function(err, stolperstein) {
				if (!err) {
					stolpersteine.push(stolperstein);
				} else {
					console.log('Error processing stolperstein (' + err + ')');
				}
				callback(err);
			});
		}, function() {
			console.log('Done processing stolpersteine');
			console.log('counter = ' + counter + '/' + stolpersteine.length);
			var importData = {
				source: source,
				stolpersteine: stolpersteine
			};
			console.log('importData = ' + importData);
			request.post({url: urlApi + '/imports', json: importData}, function(err, res, data) {
				console.log('Import (' + response.statusCode + ' ' + err + ')');
				console.log(data);
			});
		});
	});
});

function convertStolperstein($, tableRow, callback) {
	var stolperstein = {};
	var itemRows = $(tableRow).find('td');
			
	// Person
	var nameSpan = $(itemRows[1]).find('span');
	if (nameSpan.find('span').length) {
		nameSpan = nameSpan.find('span');
	}
	var names = nameSpan.text().split(',');
	stolperstein.person = {
		lastName: names[0].trim(),
		firstName: names[1].trim()
	};
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (converting...)');

	// Image
	var imageTag = $(itemRows[0]).find('img');
	stolperstein.imageUrl = uriSource.protocol + imageTag.attr('src');
	stolperstein.imageUrl = stolperstein.imageUrl.replace('/100px-', '/1024px-'); // width
			
	// Location
	stolperstein.location = {
		street: $(itemRows[2]).text().trim(),
		city: "Berlin"
	};
			
	// Laid at date
	stolperstein.laidAt = {};
	var number;
	var laidAtSpan = $(itemRows[3]).find('span');
	if ($(laidAtSpan).find('span').length) {
		laidAtSpan = laidAtSpan.find('span');
	}
	var laidAtDates = laidAtSpan.text().split('-');
	if (laidAtDates[0]) {
		number = new Number(laidAtDates[0]);
		if (number !== 0) {
			stolperstein.laidAt.year = number;
		}
	}
	if (laidAtDates[1]) {
		number = new Number(laidAtDates[1]);
		if (number !== 0) {
			stolperstein.laidAt.month = number;
		}
	}
	if (laidAtDates[2]) {
		number = new Number(laidAtDates[2]);
		if (number !== 0) {
			stolperstein.laidAt.date = number;
		}
	}
	
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (converting done)');
	callback(null, stolperstein);
}

function patchStolperstein(stolperstein, callback) {
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (patching...)');
	
	stolperstein.location.street = stolperstein.location.street.replace("(heute Eingang U-Bahnhof Turmstraße)", "");
	stolperstein.location.street = stolperstein.location.street.replace("Spenerstraße Ecke Melanchtonstraße", "Spenerstr. 14");
	stolperstein.location.street = stolperstein.location.street.replace("Bundesratufer 1", "Bundesratufer 2");

	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (patching done)');
	callback(null, stolperstein);
}

function addSourceToStolperstein(source, stolperstein, callback) {
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (adding source...)');
	
	stolperstein.source = source;

	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (adding source done)');
	callback(null, stolperstein);
}

function geocodeStolperstein(stolperstein, callback) {
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (geocoding...)');
	
	geocodeAddressMemoized(stolperstein.location.street, stolperstein.location.city, function(err, result) {
		if (result) {
			stolperstein.location.zipCode = result.zipCode;
			stolperstein.location.coordinates = {
				longitude: result.longitude,
				latitude: result.latitude
			};
		}
		console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName + ' (geocoding done, err: ' + err + ')');
		callback(err, stolperstein);
	});
}

var geocodeAddressMemoized = async.memoize(geocodeAddressRateLimited);
function geocodeAddressRateLimited(street, city, callback)	{
	setTimeout(geocodeAddress, 400, street, city, callback);
}

function geocodeAddress(street, city, callback) {
	counter++;
	var encodedStreet = encodeURIComponent(street);
	var encodedCity = encodeURIComponent(city);
	var uriGeocode = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&components=country:de&address=' + encodedStreet + ',' + encodedCity + additionalGeoHint;
	request({ uri:uriGeocode, headers: {'user-agent' : userAgent } }, function(error, response, body) {
		if (error) {
			console.log('Error when contacting maps.googleapis.com site');
			callback(new Error('Error result geocoding'));
		}
			
		body = JSON.parse(body);
		if (body.results.length === 0) {
			console.log('Error result geocoding ' + body + '(' + uriGeocode + ')' );
			callback(new Error('Error result geocoding'));
		}
		
		var zipCode;
		var addressComponents = body.results[0].address_components;
		for (var i = 0; i < addressComponents.length; i++) {
			var types = addressComponents[i].types;
			for (var j = 0; j < types.length; j++) {
				if (types[j] === "postal_code") {
					zipCode = addressComponents[i].long_name;
					break;
				}
			}
			
			if (zipCode) {
				break;
			}
		}
		
		var longitude = body.results[0].geometry.location.lng;
		var latitude = body.results[0].geometry.location.lat;
		
		if (zipCode === undefined || !longitude || !latitude) {
			console.log('Missing valid geocode data ' + street + ', ' + city);
			callback(new Error('Error result geocoding'));
		}
		
		callback(null, {
			zipCode: zipCode,
			longitude: longitude,
			latitude: latitude
		});
	});
}

function logStolperstein(stolperstein) {
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName);
//	console.log(stolperstein);
}