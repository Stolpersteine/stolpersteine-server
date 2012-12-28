var request = require('request'),
	jsdom = require('jsdom'),
	url = require('url'),
	async = require('async'),
	models = require('../models');
	
var uri = url.parse( 'http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Moabit');
var userAgent = 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)';
var counter = 0;

request({ uri:uri, headers: {'user-agent' : userAgent } }, function(error, response, body) {
  if (error && response.statusCode !== 200) {
    console.log('Error when contacting site');
		return;
  }
  
  jsdom.env({
    html: body,
    scripts: ['http://code.jquery.com/jquery-1.7.min.js']
  }, function (err, window) {
		var stolpersteine = [];
		async.series([
			function(callback) { convertStolpersteine(window.jQuery, stolpersteine, callback) },
			function(callback) { geocodeAddresses(stolpersteine, callback) },
			function(callback) { logStolpersteine(stolpersteine); callback(); },
			function(callback) { console.log('counter = ' + counter); callback(); }
		]);
	});
});

function convertStolpersteine($, stolpersteine, callback) {
	var tableRows = $('table.wikitable.sortable tr');
//	tableRows = tableRows.slice(1, tableRows.length); // first item is table header row
	tableRows = tableRows.slice(1, 5); // first item is table header row
	async.forEachSeries(tableRows, function(stolperstein, callback) {
		var stolperstein = convertStolperstein($, stolperstein);
		stolpersteine.push(stolperstein);
		callback();
	}, callback);
}

function convertStolperstein($, item) {
	var stolperstein = new models.Stolperstein();
	var itemRows = $(item).find('td');
			
	// Image
	var imageTag = $(itemRows[0]).find('img');
	stolperstein.imageUrl = uri.protocol + imageTag.attr('src');
	stolperstein.imageUrl = stolperstein.imageUrl.replace('/100px-', '/1024px-'); // width
			
	// Name
	var nameSpan = $(itemRows[1]).find('span');
	if (nameSpan.find('span').length) {
		nameSpan = nameSpan.find('span');
	}
	var names = nameSpan.text().split(',');
	stolperstein.person.lastName = names[0].trim();
	stolperstein.person.firstName = names[1].trim();
			
	// Location
	stolperstein.location.street = $(itemRows[2]).text().trim();
	stolperstein.location.city = "Berlin";
			
	// Laid at date
	var laidAtSpan = $(itemRows[3]).find('span');
	if ($(laidAtSpan).find('span').length) {
		laidAtSpan = laidAtSpan.find('span');
	}
	var laidAtDates = laidAtSpan.text().split('-');
	if (laidAtDates[0]) {
		var number = new Number(laidAtDates[0]);
		if (number != 0) {
			stolperstein.laidAt.year = number;
		}
	}
	if (laidAtDates[1]) {
		var number = new Number(laidAtDates[1]);
		if (number != 0) {
			stolperstein.laidAt.month = number;
		}
	}
	if (laidAtDates[2]) {
		var number = new Number(laidAtDates[2]);
		if (number != 0) {
			stolperstein.laidAt.date = number;
		}
	}
	
	return stolperstein;
}

function geocodeAddresses(stolpersteine, callback) {
	async.forEachSeries(stolpersteine, function(stolperstein, callback) {
		geocodeAddress(stolperstein, function(result) {
			if (result) {
				stolperstein.location.zipCode = result.zipCode;
				stolperstein.location.coordinates.longitude = result.longitude;
				stolperstein.location.coordinates.latitude = result.latitude;
			}
			callback();
		});
	}, callback);
}

function geocodeAddress(stolperstein, callback) {
	counter++;
	var street = encodeURIComponent(stolperstein.location.street);
	var city = encodeURIComponent(stolperstein.location.city);
	var uriGeocode = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&components=country:de&address=' + street + ',' + city;
	console.log(uriGeocode);
	request({ uri:uriGeocode, headers: {'user-agent' : userAgent } }, function(error, response, body) {
	  if (error && response.statusCode !== 200) {
	    console.log('Error when contacting site');
			return;
	  }
			
		body = JSON.parse(body);
		console.log(body.results.length);
		if (body.results.length === 0) {
	    console.log('Error result');
			return;
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
		
		callback({
			zipCode: zipCode,
			longitude: body.results[0].geometry.location.lng,
			latitude: body.results[0].geometry.location.lat
		});
	})
}

function logStolpersteine(stolpersteine) {
	stolpersteine.forEach(function(stolperstein) {
		console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName);
		console.log(stolperstein.location.street);
		console.log(stolperstein.location.zipCode + ' ' + stolperstein.location.city);
		console.log(stolperstein.location.coordinates);
		console.log(stolperstein.laidAt.year + ', ' + stolperstein.laidAt.month + ', ' + stolperstein.laidAt.date);
		console.log(stolperstein.imageUrl);
	});
}