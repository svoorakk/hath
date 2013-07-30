
var memory = {};

var Datastore = function () {};

Datastore.prototype.get = function (collection, id) {
	if (memory[collection])
		return memory[collection][id];
	else
		return null;
};

Datastore.prototype.put = function (collection, id, item) {
	if (!memory[collection])
		memory[collection] = {};
	memory[collection][id] = item;
};

module.exports = function () {
	return new Datastore();
}
