
/*
 * GET home page.
 */
var Housie = new require('../modules/housie');
var housie = new Housie();

exports.index = function(req, res){
  res.render('index', { title: 'Node Express' });
};

//rest api
exports.createGame = function(req, res){
	var tag = req.params.tag;
	var pwd = req.query.pwd;
	var maxnos = req.query.maxnos;
	res.send(housie.createGame(tag, pwd, maxnos));
};

exports.drawNumber = function(req, res){
	var tag = req.params.tag;
	var pwd = req.query.pwd;
	res.send(housie.drawNumber(tag, pwd));
};

exports.issueTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	var maxNo = req.query.maxno;
	var rows = req.query.rows;
	var columns = req.query.columns;
	var numberCount = req.query.numcount;
	res.send(housie.issueTicket(tag, name, maxNo, rows, columns, numberCount));
};

exports.discardTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	res.send(housie.discardTicket(tag, name));
};

exports.confirmTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	res.send(housie.confirmTicket(tag, name));
};

exports.getTickets = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	res.send(housie.getTickets(tag, name));
};

exports.getTicketsForPrint = function(req, res) {
	var tag = req.params.tag;
	var qty = req.query.qty;
	housie.getTickets(tag, qty, function(result) {
		res.send(result);
	});
};