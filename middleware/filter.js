const url = require('url');

module.exports = function(options) {
    return function(req, res, next) {
			/*
			console.log('filter start');
			
			var write = res.write;
			
			res.write = function(chunk, encoding) {
				console.log('filter response 2 ' + req.headers['content-type']);
				console.log(chunk);
				console.log(encoding);
				return write.call(res, chunk, encoding);
			};
			
        var called = false;
        var filter = undefined;
        var getArgs = url.parse(req.url, true).query;
        if (getArgs.hasOwnProperty('select')) {
        }

        res.writeJSON = function(x) {
					console.log('filter response');
        };
				*/
        next();
    }
};