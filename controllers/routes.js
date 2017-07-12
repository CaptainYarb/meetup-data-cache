'use strict';

module.exports = function(app){

	app.server.get('/meetups', function(req, res){
		app.meetup.getPROGroups(function(err, results){
			res.json(results || null);
		});
	});

	app.server.get('/meetup/:id/events', function(req, res){
		app.meetup.getEvents(req.params.id, function(err, results){
			res.json(results || null);
		});
	});

	app.server.get('/upcoming-events', function(req, res){
		app.meetup.getNextEvents(function(err, results){
			res.json(results || null);
		});
	});
}