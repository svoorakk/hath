
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
	var adminPwd = req.query.adminpwd;
	var playerPwd = req.query.playerpwd;
	var maxNos = req.query.maxnos;
	res.send(housie.createGame(tag, adminPwd, playerPwd, maxNos));
};

exports.drawNumber = function(req, res){
	var tag = req.params.tag;
	var adminPwd = req.query.admipwd;
	res.send(housie.drawNumber(tag, adminPwd));
};

exports.issueTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	var playerPwd = req.query.playerpwd;
	var maxNo = req.query.maxno;
	var rows = req.query.rows;
	var columns = req.query.columns;
	var numberCount = req.query.numcount;
	res.send(housie.issueTicket(tag, name, playerPwd, maxNo, rows, columns, numberCount));
};

exports.discardTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	var playerPwd = req.query.playerpwd;
	res.send(housie.discardTicket(tag, name, playerPwd));
};

exports.confirmTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	var playerPwd = req.query.playerpwd;
	res.send(housie.confirmTicket(tag, name, playerPwd));
};

exports.getTickets = function(req, res){
	var tag = req.params.tag;
	var name = req.query.name;
	var playerPwd = req.query.playerpwd;
	res.send(housie.getTickets(tag, name, playerPwd));
};

exports.getTicketsForPrint = function(req, res) {
	var tag = req.params.tag;
	var adminPwd = req.query.adminPwd;
	var qty = req.query.qty;
	housie.getTicketsForPrint(tag, adminPwd, qty, function(result) {
		res.send(result);
	});
};