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

console.log('Loading source data...');
request({ uri:uriSource, headers: {'user-agent' : userAgent } }, function(error, response, body) {
	console.log('Loading source data done');
  if (error) {
    console.log('Error when loading source data');
		return;
  }

	console.log('Parsing source data...');
	parseXml(body, function (err, result) {
		console.log('Parsing source data done');
	  if (error) {
	    console.log('Error when parsing source data');
			return;
	  }

		console.log('Found ' + result.markers.$.cnt + ' stolpersteine in ' + result.markers.marker.length + ' markers');
		var stolpersteine = [];
		source.retrievedAt = 	new Date(response.headers["date"]);
		var markers = result.markers.marker;
		markers = markers.slice(0, 10);	// restrict test data
		async.forEachLimit(markers, 1, function(marker, callback) {
			var location = {
				street : marker.$.adresse,
				city : "Berlin",
				coordinates : {
					longitude: marker.$.lng,
					latitude: marker.$.lat
				}
			};
			
			var stolperstein = {};
			stolperstein.location = location;
			stolperstein.source = source;
			console.log(stolperstein);
			callback();
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