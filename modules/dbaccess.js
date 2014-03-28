/**
 * New node file
 */
"option strict";

var databaseUrl = "hath";
var db = require("mongojs").connect(databaseUrl, ['game', 'log', 'ticket']);

module.exports = {
	get : function (collection, id, oneOnly, callback) {
		var idName = collection+'Tag';
		var query = {};
		if (id) 
			query[idName] = id;
		var dbcallback = function (err, result) {
			if (oneOnly) {
				//console.log('get list result ', result);
				//onsole.log('query ', query);
			}
			callback(err, result);
		};
		if (oneOnly) {
			db[collection].findOne(query, dbcallback);
		}
		else {
			db[collection].find(query, dbcallback);
		}
	},
	put: function (collection, id, item) {
		var idName = collection+'Tag';
		var query = {};
		if (id) 
			query[idName] = id;
		db[collection].update(query, item, {upsert:true}, function (err, result) {

		});
	},
	append: function (collection, item) {
		db[collection].save(item, function (err, result) {

		});
	},
	remove: function (collection, id) {
		var idName = collection+'Tag';
		var query = {};
		query[idName]=id;
		db[collection].remove(query, function (err, result) {

		});
	}
};

