/**
 * New node file
 */
var hails = require('./hails').hails;

var numberCalls = function () {};

numberCalls.prototype.getCall = function (number) {
	//get the array for the number
	var calls = hails[number];
	//pick an item from array
	var num = Math.ceil(Math.random()*calls.length);
	//return the item
	return calls[num-1];
};

module.exports = function () {
	return new numberCalls();
};