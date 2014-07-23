
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
	var gameTag = req.params.gameTag;
	console.log(req.params);
	var adminPwd = req.body.adminpwd;
	var playerPwd = req.body.playerpwd;
	var maxNos = req.body.maxnos;
	housie.createGame(gameTag, adminPwd, playerPwd, maxNos, function (err, game) {
		res.send(err ? err : game);
	});
};

exports.drawNumber = function(req, res){
	var gameTag = req.params.gameTag;
	var adminPwd = req.body.adminpwd;
	housie.drawNumber(gameTag, adminPwd, function (err, game) {
		res.send(err ? err : game);
		socketio.broadcast(gameTag, 'numberDrawn', game);
	});
};

exports.finishGame = function(req,res) {
	var gameTag = req.params.gameTag;
	var adminPwd = req.body.adminpwd;
	housie.finishGame(gameTag, adminPwd, function (err, game) {
		res.send(err ? err : game);
		socketio.broadcast(gameTag, 'gameFinished', gameTag);
	});
};

exports.validateJoin = function(req, res){
	var gameTag = req.params.gameTag;
	console.log(gameTag);
	var playerName = req.body.playername;
	var gamePwd = req.body.gamepwd;
	var playerPwd = req.body.playerpwd;
	housie.validateJoin(gameTag, gamePwd, playerPwd, playerName, function(err, game) {
		res.send(err ? err : game);
	});
};

exports.issueTicket = function(req, res){
	var gameTag = req.params.gameTag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	var maxNo = req.body.maxno;
	var rows = req.body.rows;
	var columns = req.body.columns;
	var numberCount = req.body.numcount;
	housie.issueTicket(gameTag, gamePwd, name, playerPwd, maxNo, rows, columns, numberCount, function(err, ticket) {
		res.send(err ? err : ticket);
	});
};

exports.discardTicket = function(req, res){
	var gameTag = req.params.gameTag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	housie.discardTicket(gameTag, name, gamePwd, playerPwd, function(err, msg) {
		res.send(err ? err : msg);
	});
};

exports.confirmTicket = function(req, res){
	var gameTag = req.params.gameTag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	housie.confirmTicket(gameTag, name, gamePwd, playerPwd, function(err, msg) {
		res.send(err ? err : msg);
	});
};

exports.getTickets = function(req, res){
	var gameTag = req.params.gameTag;
	var name = req.body.name;
	var playerPwd = req.body.playerpwd;
	var gamePwd = req.body.gamepwd;
	housie.getTickets(gameTag, name, gamePwd, playerPwd, function(err, tickets) {
		res.send(err ? err : tickets);
	});
};

exports.getTicketsForPrint = function(req, res) {
	var gameTag = req.params.gameTag;
	var adminPwd = req.body.adminpwd;
	var qty = req.body.qty;
	housie.getTicketsForPrint(gameTag, adminPwd, qty, function(err, result) {
		res.render('ticketsforprint', {'tickets': result, 'err' : err});
	});
};

exports.getGame = function(req, res) {
	var gameTag = req.params.gameTag;
	var gamePwd = req.body.gamepwd;
	housie.getGame(gameTag, gamePwd, function(err, game) {
		res.send(err ? err : game);
	});
};

exports.gameStats = function(req, res) {
	var gameTag = req.params.gameTag;
	var adminPwd = req.body.adminpwd;
	housie.gameStats(gameTag, adminPwd, function(err, stats) {
		res.send(err ? err : stats);
	});
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

exports.checkGameList = function(req, res) {
	var list = req.body.list;
	housie.checkGameList(list, function (err, list) {
		if (err) 
			res.send(err);
		else
			res.send(list);
	});
};

exports.log = function(req, res) {
	var gameTag = req.params.gameTag;
	var adminPwd = req.body.adminpwd;
	housie.log(gameTag, adminPwd, function (err, log) {
		if (err) 
			res.send(err);
		else
			res.send(log);
	});
};
