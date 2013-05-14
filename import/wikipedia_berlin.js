"use strict";

var request = require('request'),
	jsdom = require('jsdom'),
	url = require('url'),
	util = require('util'),
	async = require('async');
	
var uriSources = [
	url.parse('http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Moabit'),
	url.parse('http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Britz')
];
//var urlApi = 'http://127.0.0.1:3000/api';
var urlApi = 'https://stolpersteine-optionu.rhcloud.com/api';
var userAgent = 'Stolpersteine/1.0 (http://option-u.com; stolpersteine@option-u.com)';

var numImages = 0;

for (var i = 0; i < uriSources.length; i++) {
	var uriSource = uriSources[i];
	
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
			console.log('Num table rows: ' + tableRows.length);
	//		tableRows = tableRows.slice(91, 92);	// restrict test data
			async.forEachLimit(tableRows, 1, function(tableRow, callback) {
				async.waterfall([
					convertStolperstein.bind(undefined, $, tableRow),
					patchStolperstein,
					addSourceToStolperstein.bind(undefined, source)
				], function(err, stolperstein) {
					console.log(util.inspect(stolperstein));
					if (!err) {
						stolpersteine.push(stolperstein);
					} else {
						console.log('Error processing stolperstein (' + err + ')');
					}
					callback(err);
				});
			}, function() {
				console.log('Done processing ' + stolpersteine.length + ' stolperstein(e), ' + numImages + ' image(s)');
				var importData = {
					source: source,
					stolpersteine: stolpersteine
				};
	//			console.log('importData = ' + importData);
	//			request.post({url: urlApi + '/imports', json: importData}, function(err, res, data) {
	//				console.log('Import (' + response.statusCode + ' ' + err + ')');
	//				console.log(data);
	//			});
			});
		});
	});
}

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
	console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName);

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
	
	callback(null, stolperstein);
}

function patchStolperstein(stolperstein, callback) {
	if (/Photo-request.svg.png$/.test(stolperstein.imageUrl)) {
		delete stolperstein.imageUrl;
	}
	
	if (stolperstein.imageUrl) {
		numImages++;
	}
	
	callback(null, stolperstein);
}

function addSourceToStolperstein(source, stolperstein, callback) {
	stolperstein.source = source;
	
	callback(null, stolperstein);
}
