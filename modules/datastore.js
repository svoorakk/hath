
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

Datastore.prototype.remove = function (collection, id) {
	if (memory[collection] && memory[collection][id])
		delete memory[collection][id];
};

module.exports = function () {
	return new Datastore();
}
