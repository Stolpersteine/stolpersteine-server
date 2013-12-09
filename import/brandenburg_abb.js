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

// http://www.adaltas.com/projects/node-csv/

"use strict";

var request = require('request'),
	csv = require('csv'),
	util = require('util');
	
var sourceOptions = {
	url: 'http://www.aktionsbuendnis-brandenburg.de/aktionen-positionen/stolpersteine_export.csv',
	headers: {
		'User-Agent': 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)'
	}
};
	
var source = { 
	url: 'http://www.aktionsbuendnis-brandenburg.de',
	name: "Aktionsbündnis Brandenburg"
};

// Request data
console.log('Loading source data...');
request.get(sourceOptions, function(error, response, data) {     
	console.log('Loading source data done');
 	if (error) {
   	console.log('Error while loading source data ' + error);
		return;
 	}

	readCsvData(data, function(error, stolpersteine) {
	 	if (error) {
	   	console.log('Error while reading CSV data ' + error);
			return;
	 	}
		
//		for (var i = 0; i < stolpersteine.length; i++) {
//			var stolperstein = stolpersteine[i];
//			console.log(stolperstein.location.city);
//		}
		console.log(stolpersteine.length + " stolperstein(e)");

		process.exit();
	});
});

function readCsvData(data, callback) {
	var stolpersteine = [];
	var processingError = null;
	csv()
	.from(data)
	.from.options({trim : true})
	.on('record', function(row, index) {
		if (index == 0) {
			return;	// column names
		}
		
		if (processingError) {
			return;	// ignore after first error
		}

//		if (index < 100) {
			row = patchCsv(row);
		  console.log('#' + index + ' ' + JSON.stringify(row));
			
			var stolperstein = {
				type : "stolperstein",
			};
			stolperstein.location = convertLocation(row[2].trim());
			stolperstein.location.coordinates = convertCoordinates(row[0].trim());
			stolperstein.person = convertPerson(row[1].trim());
			
			console.log(JSON.stringify(stolperstein));
			
			stolpersteine.push(stolperstein);
//		}
	})
	.on('end', function(count) {
		console.log('end');
	  console.log('Read ' + count + ' line(s) of CSV data');
		callback(null, stolpersteine);
	})
	.on('error', function(error) {
		processingError = error;
		callback(error, null);
	});
}

function convertCoordinates(column) {
	// "GEOMETRYCOLLECTION(POINT(<lng> <lat>))"
	var coordinates = column.match(/\([ ]*([0-9.,]*)[ ]*([0-9.,]*)[ ]*\)/);	
	return {
		longitude : coordinates[1].replace(",", ".").trim(),
		latitude : coordinates[2].replace(",", ".").trim()
	};
}

function convertPerson(column) {
	// "<title> <first> <last>"
	var names = column.split(" ");
	return {
		firstName : names.slice(0, names.length - 1).join(" "),
		lastName : names[names.length - 1]
	};
}

function convertLocation(column) {
	// "<street>, <zip> <city>"
	var locations = column.match(/(.*),[ ]*([0-9]*) (.*)/);
	return {
		street : locations[1],
		zipCode : locations[2],
		city : locations[3],
		state : "Brandenburg"
	};
}

function patchCsv(row)
{
	row[2] = row[2].replace("Friedrichshagener Straße 32 15556 Schöneiche", "Friedrichshagener Straße 32, 15556 Schöneiche");
	row[2] = row[2].replace("Große Oderstraße 46", "Große Oderstraße 46, 15230 Frankfurt (Oder)");
	row[2] = row[2].replace("Friedrichstraße 21B 16269 Wriezen ", "Friedrichstraße 21B, 16269 Wriezen");
	row[0] = row[0].replace("(13.860317\r\n53.315064)", "(13.860317 53.315064)");

	return row;
}