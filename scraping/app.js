var request = require('request'),
	jsdom = require('jsdom')
	url = require('url');
	
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
		$('table.wikitable.sortable tr').each(function(i, item) {
			// First item is table header row
			if (i == 0) {
				return true;
			}
			
			var itemRows = $(item).find('td');
			
			// Image
			var imageTag = $(itemRows[0]).find('img');
			var imageUrl = uri.protocol + imageTag.attr('src');
			imageUrl = imageUrl.replace('/100px-', '/1024px-'); // width
			
			// Name
			var nameSpan = $(itemRows[1]).find('span');
			if (nameSpan.find('span').length) {
				nameSpan = nameSpan.find('span');
			}
			var names = nameSpan.text().split(',');
			var lastName = names[0].trim();
			var firstName = names[1].trim();
			
			// Street
			var street = $(itemRows[2]).text().trim();
			
			// Laid at date
			var laidAtSpan = $(itemRows[3]).find('span');
			if ($(laidAtSpan).find('span').length) {
				laidAtSpan = laidAtSpan.find('span');
			}
			var laidAtDates = laidAtSpan.text().split('-');
			var laidAtYear;
			if (laidAtDates[0]) {
				var number = new Number(laidAtDates[0]);
				if (number != 0) {
					laidAtYear = number;
				}
			}
			var laidAtMonth;
			if (laidAtDates[1]) {
				var number = new Number(laidAtDates[1]);
				if (number != 0) {
					laidAtMonth = number;
				}
			}
			var laidAtDate;
			if (laidAtDates[2]) {
				var number = new Number(laidAtDates[2]);
				if (number != 0) {
					laidAtDate = number;
				}
			}
			
			console.log('- ' + lastName + ', ' + firstName + ', ' + street + ', ' + laidAtYear + ', ' + laidAtMonth + ', ' + laidAtDate);
			console.log(imageUrl);
		});
  });
});