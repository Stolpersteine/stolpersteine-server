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
	'/Liste_der_Stolpersteine_in_Berlin-Britz'
//	'/Liste_der_Stolpersteine_in_Berlin-Moabit'
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
					addMetaToImage,
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