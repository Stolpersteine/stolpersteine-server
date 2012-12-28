var request = require('request'),
	jsdom = require('jsdom'),
	url = require('url'),
	models = require('../models');
	
var uri = url.parse( 'http://de.m.wikipedia.org/wiki/Liste_der_Stolpersteine_in_Berlin-Moabit');

request({ uri:uri, headers: {'user-agent' : 'Stolpersteine/1.0 (http://option-u.com; admin@option-u.com)'} }, function (error, response, body) {
  if (error && response.statusCode !== 200) {
    console.log('Error when contacting site')
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
			
			var stolperstein = new models.Stolperstein();
			stolpersteine.push(stolperstein);
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
			
			// Street
			stolperstein.location.street = $(itemRows[2]).text().trim();
			
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
		});
		
		// Log stolpersteine
		stolpersteine.forEach(function(stolperstein) {
			console.log('- ' + stolperstein.person.lastName + ', ' + stolperstein.person.firstName);
			console.log(stolperstein.location.street);
			console.log(stolperstein.laidAt.year + ', ' + stolperstein.laidAt.month + ', ' + stolperstein.laidAt.date);
			console.log(stolperstein.imageUrl);
		});
  });
});