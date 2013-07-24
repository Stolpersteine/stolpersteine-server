"use strict";

var restify = require('restify'),
	util = require('util'),
	async = require('async');
	
var apiClient = restify.createJsonClient({
	version: '*',
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
	url: 'https://stolpersteine-api.eu01.aws.af.cm'
//	url: 'http://127.0.0.1:3000'
});

var importData = {
	source: {
		url: "http://de.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin",
		name: "Wikipedia",
		retrievedAt: new Date()
	}, 
	stolpersteine: [{
		type: "stolperschwelle",
		person: {
			lastName: "Jüdischer Betraum",
			biographyUrl: "http://de.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Friedenau"
		},
		location: {
			street: "Stierstraße 21",
			zipCode: "12159",
			sublocality1: "Tempelhof-Schöneberg",
			sublocality2: "Friedenau",
			city: "Berlin",
			coordinates: {
				longitude: "13.3375",
				latitude: "52.473888888889"
			}
		}
	}, {
		type: "stolperschwelle",
		person: {
			lastName: "Gossner-Mission",
			biographyUrl: "http://de.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Friedenau"
		},
		location: {
			street: "Handjerystraße 20A",
			zipCode: "12159",
			sublocality1: "Tempelhof-Schöneberg",
			sublocality2: "Friedenau",
			city: "Berlin",
			coordinates: {
				longitude: "13.332777777778",
				latitude: "52.474166666667"
			}
		}
	}]
};

console.log('Importing ' + importData.stolpersteine.length + ' stolperstein(e)...');
console.log(util.inspect(importData, false, null));
apiClient.post('/v1/imports', importData, function(err, req, res, data) {
	console.log('Import data:');
	console.log(util.inspect(data, false, null));
	if (err) {
		console.log('Error during import (' + err + ')');
	} else {
		console.log('Import command: curl -v -d "" ' + apiClient.url.href + 'v1/imports/' + data.id + '/execute')
		console.log('Done.')
	}
	return;
});