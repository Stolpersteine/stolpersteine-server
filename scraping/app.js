var request = require('request'),
	jsdom = require('jsdom'),
	url = require('url'),
	async = require('async'),
	models = require('../models');
	
var uri = url.parse( 'http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Moabit');
var userAgent = 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)';

request({ uri:uri, headers: {'user-agent' : userAgent } }, function(error, response, body) {
  if (error && response.statusCode !== 200) {
    console.log('Error when contacting site');
		return;
  }
  
  jsdom.env({
    html: body,
    scripts: ['http://code.jquery.com/jquery-1.7.min.js']
  }, function (err, window) {
    var $ = window.jQuery;
		var stolpersteine = [];
		$('table.wikitable.sortable tr').each(function(i, item) {
			// First item is table header row
			if (i == 0) {
				return true;
			}
			
			if (i > 3) {
				return true;
			}

			// Convert data
			var stolperstein = html2Stolperstein($, item);
			stolpersteine.push(stolperstein);
		
			// Geo code addresses
			geocodeAddresses(stolpersteine, function(err) {
				logStolpersteine(stolpersteine);
			});
		});
	});
});

function html2Stolperstein($, item) {
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
		var street = encodeURIComponent(stolperstein.location.street);
		var city = encodeURIComponent(stolperstein.location.city);
		var uriGeocode = 'http://maps.google.de/maps/geo?region=de&output=json&q=' + street + ',' + city + ',Deutschland';
		request({ uri:uriGeocode, headers: {'user-agent' : userAgent } }, function(error, response, body) {
		  if (error && response.statusCode !== 200) {
		    console.log('Error when contacting site');
				return;
		  }
			
			body = JSON.parse(body);
			if (body.Status.code != 200) {
		    console.log('Error result ' + body.Status.code);
				return;
			}
			
			stolperstein.location.zipCode = body.Placemark[0].AddressDetails.Country.AdministrativeArea.Locality.PostalCode.PostalCodeNumber;
			stolperstein.location.coordinates.longitude = body.Placemark[0].Point.coordinates[0];
			stolperstein.location.coordinates.latitude = body.Placemark[0].Point.coordinates[1];
			callback();
		});
	}, callback);
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