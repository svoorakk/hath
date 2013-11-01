
var memory = {};

var Datastore = function () {};

Datastore.prototype.get = function (collection, id, callback) {
	var item = null;
	if (memory[collection])
		if (id)
			item = memory[collection][id];
		else
			item = memory[collection];
	callback(null, item);
};

Datastore.prototype.put = function (collection, id, item) {
	if (!memory[collection])
		memory[collection] = {};
	memory[collection][id] = item;
};

Datastore.prototype.remove = function (collection, id) {
	if (memory[collection] && memory[collection][id])
		delete memory[collection][id];
};

module.exports = function () {
	return new Datastore();
};
