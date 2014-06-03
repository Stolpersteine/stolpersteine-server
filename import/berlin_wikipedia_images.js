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
	jsdom = require('jsdom'),
	parseXml = require('xml2js').parseString,
	util = require('util'),
	async = require('async');

var uriSources = [
	'/Liste_der_Stolpersteine_in_Berlin-Britz',
	'/Liste_der_Stolpersteine_in_Berlin-Mitte',
	'/Liste_der_Stolpersteine_in_Berlin-Moabit',
	'/Liste_der_Stolpersteine_in_Berlin-Hansaviertel',
	'/Liste_der_Stolpersteine_in_Berlin-Tiergarten',
	'/Liste_der_Stolpersteine_in_Berlin-Wedding',
	'/Liste_der_Stolpersteine_in_Berlin-Gesundbrunnen',
	'/Liste_der_Stolpersteine_in_Berlin-Friedrichshain',
	'/Liste_der_Stolpersteine_in_Berlin-Kreuzberg',
	'/Liste_der_Stolpersteine_in_Berlin-Prenzlauer_Berg',
	'/Liste_der_Stolpersteine_in_Berlin-Weißensee',
	'/Liste_der_Stolpersteine_in_Berlin-Pankow',
	'/Liste_der_Stolpersteine_in_Berlin-Niederschönhausen',
	'/Liste_der_Stolpersteine_in_Berlin-Charlottenburg',
	'/Liste_der_Stolpersteine_in_Berlin-Wilmersdorf',
	'/Liste_der_Stolpersteine_in_Berlin-Schmargendorf',
	'/Liste_der_Stolpersteine_in_Berlin-Grunewald',
	'/Liste_der_Stolpersteine_in_Berlin-Westend',
	'/Liste_der_Stolpersteine_in_Berlin-Charlottenburg-Nord',
	'/Liste_der_Stolpersteine_in_Berlin-Halensee',
	'/Liste_der_Stolpersteine_in_Berlin-Spandau',
	'/Liste_der_Stolpersteine_in_Berlin-Falkenhagener_Feld',
	'/Liste_der_Stolpersteine_in_Berlin-Haselhorst',
	'/Liste_der_Stolpersteine_in_Berlin-Siemensstadt',
	'/Liste_der_Stolpersteine_in_Berlin-Kladow',
	'/Liste_der_Stolpersteine_in_Berlin-Wilhelmstadt',
	'/Liste_der_Stolpersteine_in_Berlin-Steglitz',
	'/Liste_der_Stolpersteine_in_Berlin-Lichterfelde',
	'/Liste_der_Stolpersteine_in_Berlin-Lankwitz',
	'/Liste_der_Stolpersteine_in_Berlin-Zehlendorf',
	'/Liste_der_Stolpersteine_in_Berlin-Dahlem',
	'/Liste_der_Stolpersteine_in_Berlin-Nikolassee',
	'/Liste_der_Stolpersteine_in_Berlin-Wannsee',
	'/Liste_der_Stolpersteine_in_Berlin-Schöneberg',
	'/Liste_der_Stolpersteine_in_Berlin-Friedenau',
	'/Liste_der_Stolpersteine_in_Berlin-Tempelhof',
	'/Liste_der_Stolpersteine_in_Berlin-Mariendorf',
	'/Liste_der_Stolpersteine_in_Berlin-Marienfelde',
	'/Liste_der_Stolpersteine_in_Berlin-Lichtenrade',
	'/Liste_der_Stolpersteine_in_Berlin-Neukölln',
	'/Liste_der_Stolpersteine_in_Berlin-Britz',
	'/Liste_der_Stolpersteine_in_Berlin-Alt-Treptow',
	'/Liste_der_Stolpersteine_in_Berlin-Plänterwald',
	'/Liste_der_Stolpersteine_in_Berlin-Baumschulenweg',
	'/Liste_der_Stolpersteine_in_Berlin-Johannisthal',
	'/Liste_der_Stolpersteine_in_Berlin-Niederschöneweide',
	'/Liste_der_Stolpersteine_in_Berlin-Altglienicke',
	'/Liste_der_Stolpersteine_in_Berlin-Adlershof',
	'/Liste_der_Stolpersteine_in_Berlin-Oberschöneweide',
	'/Liste_der_Stolpersteine_in_Berlin-Köpenick',
	'/Liste_der_Stolpersteine_in_Berlin-Friedrichshagen',
	'/Liste_der_Stolpersteine_in_Berlin-Rahnsdorf',
	'/Liste_der_Stolpersteine_in_Berlin-Grünau',
	'/Liste_der_Stolpersteine_in_Berlin-Müggelheim',
	'/Liste_der_Stolpersteine_in_Berlin-Biesdorf',
	'/Liste_der_Stolpersteine_in_Berlin-Kaulsdorf',
	'/Liste_der_Stolpersteine_in_Berlin-Mahlsdorf',
	'/Liste_der_Stolpersteine_in_Berlin-Friedrichsfelde',
	'/Liste_der_Stolpersteine_in_Berlin-Karlshorst',
	'/Liste_der_Stolpersteine_in_Berlin-Lichtenberg',
	'/Liste_der_Stolpersteine_in_Berlin-Alt-Hohenschönhausen',
	'/Liste_der_Stolpersteine_in_Berlin-Fennpfuhl',
	'/Liste_der_Stolpersteine_in_Berlin-Rummelsburg',
	'/Liste_der_Stolpersteine_in_Berlin-Reinickendorf',
	'/Liste_der_Stolpersteine_in_Berlin-Tegel',
	'/Liste_der_Stolpersteine_in_Berlin-Konradshöhe',
	'/Liste_der_Stolpersteine_in_Berlin-Heiligensee',
	'/Liste_der_Stolpersteine_in_Berlin-Frohnau',
	'/Liste_der_Stolpersteine_in_Berlin-Hermsdorf',
	'/Liste_der_Stolpersteine_in_Berlin-Waidmannslust'
	'/Liste_der_Stolpersteine_in_Berlin-Lübars',
	'/Liste_der_Stolpersteine_in_Berlin-Wittenau',
	'/Liste_der_Stolpersteine_in_Berlin-Märkisches_Viertel',
	'/Liste_der_Stolpersteine_in_Berlin-Borsigwalde'
];

var userAgent = 'Stolpersteine/1.0 (http://option-u.com; stolpersteine@option-u.com)';

var wikipediaClient = restify.createStringClient({
	userAgent: userAgent,
	url: 'http://de.m.wikipedia.org'
});

var toolserverClient = restify.createStringClient({
	userAgent: userAgent,
	url: 'http://toolserver.org'
});

for (var i = 0; i < uriSources.length; i++) {
	var uriSource = uriSources[i];
	
	console.log('Loading source data for ' + uriSource + '...');
	wikipediaClient.get('/wiki/Liste_der_Stolpersteine_in_Berlin-Britz', function(error, request, response, data) {
		console.log('done');
  		if (error) {
    		console.log('Error while loading source data');
			return;
  		}
  
	  	jsdom.env({
	    	html: data,
	    	scripts: ['http://code.jquery.com/jquery-1.7.min.js']
	  	}, function (error, window) {
			var images = [];
		
			var source = { 
				url: uriSource.href,
				name: "Wikipedia",
				retrievedAt: new Date(response.headers.date)
			};
		
			var $ = window.jQuery;
			var tableRows = $('table.wikitable.sortable tr');
			tableRows = tableRows.slice(1, tableRows.length); // first item is table header row
			console.log('Num table rows: ' + tableRows.length);
			tableRows = tableRows.slice(1, 2);	// restrict test data
			async.forEachLimit(tableRows, 1, function(tableRow, callback) {
				async.waterfall([
					convertImage.bind(undefined, $, tableRow),
					patchImage,
					addSourceToImage.bind(undefined, source),
					//addMetaToImage,
					logImage,
				], function(error, image) {
					if (!error) {
						if (image.canonicalUrl) {
							images.push(image);
							console.log(util.inspect(image));
						}
					} else {
						console.log('Error processing image (' + error + ')');
					}
					callback(error);
				});
			}, function() {
				console.log('Done processing ' + tableRows.length + ' stolperstein(e), ' + images.length + ' image(s)');
				var importData = {
					source: source,
					images: images
				};
				process.exit();
			});
		});
	});
}

function convertImage($, tableRow, callback) {
	var image = {};
	var itemRows = $(tableRow).find('td');
			
	// Person
	var nameSpan = $(itemRows[1]).find('span');
	if (nameSpan.find('span').length) {
		nameSpan = nameSpan.find('span');
	}
	var names = nameSpan.text().split(',');
	image.person = {
		lastName: names[0].trim(),
		firstName: names[1].trim()
	};
	
	// Image
	var imageTag = $(itemRows[0]).find('img');
	image.url = 'http:' + imageTag.attr('src');
	image.url = image.url.replace('/100px-', '/1024px-'); // width
	
	var linkTag = $(itemRows[0]).find('a');
	image.canonicalUrl = linkTag.attr('href');
	image.canonicalUrl = image.canonicalUrl.replace('/wiki/Datei:', '');

	// Location
	image.location = {
		street: $(itemRows[2]).text().trim(),
		city: "Berlin"
	};
	
	callback(null, image);
}

function patchImage(image, callback) {
	if (/Photo-request.svg.png$/.test(image.imageUrl)) {
		delete image.url;
		delete image.canonicalUrl;
	}
	
	callback(null, image);
}

function addSourceToImage(source, image, callback) {
	image.source = source;
	
	callback(null, image);
}

function addMetaToImage(image, callback) {
	console.log('Loading image data...');
	toolserverClient.get('/~magnus/commonsapi.php?image=' + image.canonicalUrl, function(error, request, response, data) {
		console.log('done');
		parseXml(data, function (error, result) {
			console.log(result.response.file[0].name[0]);
			callback(error, image);
		});
	});
}

function logImage(image, callback) {	
	callback(null, image);
}