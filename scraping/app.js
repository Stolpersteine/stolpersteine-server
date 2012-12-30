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
		var $ = window.jQuery;
		var tableRows = $('table.wikitable.sortable tr');
		tableRows = tableRows.slice(1, tableRows.length); // first item is table header row
//		tableRows = tableRows.slice(1, 5);
		async.forEachLimit(tableRows, 3, function(tableRow, callback) {
			async.waterfall([
				function(callback) { convertStolperstein($, tableRow, callback) },
				patchStolperstein,
				geocodeStolperstein,
			], function(err, stolperstein) {
				if (!err) {
					stolpersteine.push(stolperstein);
					logStolperstein(stolperstein);
				} else {
					console.log('Error processing stolperstein');
				}
				callback();
			});
		}, function() {
			console.log('counter = ' + counter + '/' + stolpersteine.length);
		});
	});
});

function convertStolperstein($, tableRow, callback) {
	var stolperstein = new models.Stolperstein();
	var itemRows = $(tableRow).find('td');
			
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
	
	callback(null, stolperstein);
}

function patchStolperstein(stolperstein, callback) {
	stolperstein.location.street = stolperstein.location.street.replace("(heute Eingang U-Bahnhof Turmstraße)", "");
	callback(null, stolperstein);
}

function geocodeStolperstein(stolperstein, callback) {
	geocodeAddressMemoized(stolperstein.location.street, stolperstein.location.city, function(result) {
		if (result) {
			stolperstein.location.zipCode = result.zipCode;
			stolperstein.location.coordinates.longitude = result.longitude;
			stolperstein.location.coordinates.latitude = result.latitude;
		}
		callback(null, stolperstein);
	});
}

var geocodeAddressMemoized = async.memoize(geocodeAddressRateLimited);
function geocodeAddressRateLimited(street, city, callback)	{
	setTimeout(geocodeAddress, 400, street, city, callback);
};

function geocodeAddress(street, city, callback) {
	counter++;
	var street = encodeURIComponent(street);
	var city = encodeURIComponent(city);
	var uriGeocode = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&components=country:de&address=' + street + ',' + city;
	request({ uri:uriGeocode, headers: {'user-agent' : userAgent } }, function(error, response, body) {
	  if (error && response.statusCode !== 200) {
	    console.log('Error when contacting site');
			return;
	  }
			
		body = JSON.parse(body);
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

function logStolperstein(stolperstein) {
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName);
	console.log(stolperstein.location.street);
	console.log(stolperstein.location.zipCode + ' ' + stolperstein.location.city);
	console.log(stolperstein.location.coordinates);
	console.log(stolperstein.laidAt.year + ', ' + stolperstein.laidAt.month + ', ' + stolperstein.laidAt.date);
	console.log(stolperstein.imageUrl);
}