
/*
 * GET home page.
 */
var Housie = new require('../modules/housie');
var housie = new Housie();

var socketio;

exports.init = function(io){
	socketio = io;
};

exports.index = function(req, res){
  res.render('index', { title: 'Node Express' });
};

//rest api
exports.createGame = function(req, res){
	//console.log('req.connection.remotePort', req.connection.remotePort);
	//console.log('req.connection.remoteAddress', req.connection.remoteAddress);
	//console.log('req.headers', req.headers);
	var tag = req.params.tag;
	console.log(tag);
	var adminPwd = req.body.adminpwd;
	var playerPwd = req.body.playerpwd;
	var maxNos = req.body.maxnos;
	housie.createGame(tag, adminPwd, playerPwd, maxNos, function (err, game) {
		res.send(err ? err : game);
	});
};

exports.drawNumber = function(req, res){
	var tag = req.params.tag;
	var adminPwd = req.body.adminpwd;
	housie.drawNumber(tag, adminPwd, function (err, game) {
		res.send(err ? err : game);
	});
};

exports.validateJoin = function(req, res){
	var tag = req.params.tag;
	console.log(tag);
	var playerName = req.body.playername;
	var gamePwd = req.body.gamepwd;
	var playerPwd = req.body.playerpwd;
	housie.validateJoin(tag, gamePwd, playerPwd, playerName, function(err, game) {
		res.send(err ? err : game);
	});
};

exports.issueTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	var maxNo = req.body.maxno;
	var rows = req.body.rows;
	var columns = req.body.columns;
	var numberCount = req.body.numcount;
	housie.issueTicket(tag, gamePwd, name, playerPwd, maxNo, rows, columns, numberCount, function(err, ticket) {
		res.send(err ? err : ticket);
	});
};

exports.discardTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	res.send(housie.discardTicket(tag, name, gamePwd, playerPwd));
};

exports.confirmTicket = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	res.send(housie.confirmTicket(tag, name, gamePwd, playerPwd));
};

exports.getTickets = function(req, res){
	var tag = req.params.tag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	res.send(housie.getTickets(tag, name, gamePwd, playerPwd));
};

exports.getTicketsForPrint = function(req, res) {
	var tag = req.params.tag;
	var adminPwd = req.body.adminpwd;
	var qty = req.body.qty;
	housie.getTicketsForPrint(tag, adminPwd, qty, function(err, result) {
		res.render('ticketsforprint', {tickets: result});
	});
};

exports.getGame = function(req, res) {
	var tag = req.params.tag;
	var gamePwd = req.body.gamepwd;
	res.send(housie.getGame(tag, gamePwd));
};

exports.gameStats = function(req, res) {
	var tag = req.params.tag;
	var adminPwd = req.body.adminpwd;
	res.send(housie.gameStats(tag, adminPwd));
};

exports.gameList = function(req, res) {
	var filter = req.params.filter;
	housie.gameList(filter, false, function (err, list) {
		if (err) 
			res.send(err);
		else
			res.send(list);
	});
};

exports.newGameList = function(req, res) {
	var filter = req.params.filter;
	housie.gameList(filter, true, function (err, list) {
		if (err) 
			res.send(err);
		else
			res.send(list);
	});
};
