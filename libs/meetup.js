'use strict';
module.exports = function(app){
	var _ = require('lodash'),
		async = require('async'),
		meetupAPI = require('meetup-api');

	var meetup = meetupAPI(app.config.meetup.api);


	var helpers = {
		cache: {
			get: function(key, callback){
				return app.redis.get(key, function(err, results){
					if(err){ return callback(err); }
					return callback(null, JSON.parse(results));
				});
			},
			save: function(key, data, cache, callback){
				if(cache && !callback){
					callback = cache;
					cache = null;
				}
				return app.redis.set(key, JSON.stringify(data), function(err, results){
					app.redis.expire(key, cache || app.config.meetup.defaultCache);
					return callback(err, results);
				});
			},
			delete: function(key, callback){
				return app.redis.del(key, callback);
			}
		},
		trim: function(key, data){
			return _.map(data, function(item){
				return _.pick(item, app.config.meetup.trim[key]);
			});
		}
	};

	app.meetup = {
		getNextEvents: function(callback){
			var info = {};
			return async.series([
				function(cb){
					app.meetup.getPROGroups(function(err, results){
						if(err){ return cb(err); }
						info.groups = results;
						return cb();
					});
				},
				function(cb){
					info.events = [];
					return async.each(info.groups, function(group, ecb){
						app.meetup.getEvents(group.urlname, function(err, events, ratelimiting){
							if(err){ return ecb(err); }
							if(events && events.length){
								var event = events[0];
								event.group = group;
								if(event.visibility === "public"){
									info.events.push(event);
								}
							}else{
								app.info('No events found group group %s', group.name);
							}
							if(ratelimiting && ratelimiting.remaining === "0"){
								var time = (parseInt(ratelimiting.reset) *1000);
								app.info('Rate limited. Waiting %s seconds...', time);
								return setTimeout(ecb, time);
							}
							return ecb();
						});
					}, cb);
				}
			], function(err){
				if(err){ return callback(err); }
				return callback(null, info.events);
			})
		},
		getEvents: function(groupUrl, callback){
			var key = 'getEvents:' + groupUrl;
			helpers.cache.get(key, function(err, events){
				if(err){ return callback(err); }
				if(events){
					return callback(null, events, null);
				}
				return meetup.getEvents({group_urlname: groupUrl}, function(err, results){
					if(err){ return callback(err); }
					var events = helpers.trim('getEvents', results.results);
					helpers.cache.save(key, events, function(err){
						if(err){ app.warn('Failed to cache getEvents for: %s', groupUrl).debug(err); }
					});
					return callback(null, events, results.ratelimiting);
				});
			});
		},
		getPROGroups: function(callback){
			helpers.cache.get('getPROGroups', function(err, groups){
				if(err){ return callback(err); }
				if(groups){
					return callback(null, groups);
				}
				return meetup.getPROGroups({urlname: app.config.meetup.pro.urlname}, function(err, results){
					if(err){ return callback(err); }
					results = helpers.trim('getPROGroups', results);
					var groups = [];
					_.each(results, function(group){
						if(group.status !== 'Active' || app.config.meetup.blacklistedGroups.includes(group.id)){
							return;
						}
						groups.push(group);
					});
					helpers.cache.save('getPROGroups', groups, function(err){
						if(err){ app.warn('Failed to cache getPROGroups').debug(err); }
					});
					return callback(null, groups);
				});
			});
		}
	};
}