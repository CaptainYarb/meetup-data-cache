'use strict';
module.exports = function(app){
	app.cache = require('apicache').middleware;
	app.emit('express.middelware', function(req, res, next){
		return next();
	});
};