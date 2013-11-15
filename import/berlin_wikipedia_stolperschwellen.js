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
	util = require('util'),
	async = require('async');
	
var apiClient = restify.createJsonClient({
	version: '*',
	userAgent: 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)',
	url: 'https://stolpersteine-api.eu01.aws.af.cm'
	// url: 'http://127.0.0.1:3000'
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
			biographyUrl: "http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Friedenau#Stolperschwellen"
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
			biographyUrl: "http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Friedenau#Stolperschwellen"
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
	console.log('Resulting import data:');
	console.log(util.inspect(data, false, null));
	if (err) {
		console.log('Error during import (' + err + ')');
	} else {
		console.log(data.deleteActions.targetIds.length + ' delete action(s), ' + data.createActions.stolpersteine.length + ' create action(s)');
		console.log('Import command: curl -v -d "" ' + apiClient.url.href + 'v1/imports/' + data.id + '/execute')
		console.log('Done.')
	}
	return;
});