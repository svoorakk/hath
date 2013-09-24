
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
	console.log('req.connection.remotePort', req.connection.remotePort);
	console.log('req.connection.remoteAddress', req.connection.remoteAddress);
	console.log('req.headers', req.headers);
	var tag = req.params.tag;
	var adminPwd = req.body.adminpwd;
	var playerPwd = req.body.playerpwd;
	var maxNos = req.body.maxnos;
	res.send(housie.createGame(tag, adminPwd, playerPwd, maxNos));
};

exports.drawNumber = function(req, res){
	var tag = req.params.tag;
	var adminPwd = req.body.admipwd;
	res.send(housie.drawNumber(tag, adminPwd));
};

exports.validateJoin = function(req, res){
	var tag = req.params.tag;
	var playerName = req.body.playername;
	var playerPwd = req.body.playerpwd;
	res.send(housie.validateJoin(tag, playerPwd, playerName));
};

exports.issueTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var maxNo = req.body.maxno;
	var rows = req.body.rows;
	var columns = req.body.columns;
	var numberCount = req.body.numcount;
	res.send(housie.issueTicket(tag, name, playerPwd, maxNo, rows, columns, numberCount));
};

exports.discardTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	res.send(housie.discardTicket(tag, name, playerPwd));
};

exports.confirmTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	res.send(housie.confirmTicket(tag, name, playerPwd));
};

exports.getTickets = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	res.send(housie.getTickets(tag, name, playerPwd));
};

exports.getTicketsForPrint = function(req, res) {
	var tag = req.params.tag;
	var adminPwd = req.body.adminpwd;
	var qty = req.body.qty;
	housie.getTicketsForPrint(tag, adminPwd, qty, function(result) {
		res.send(result);
	});
};