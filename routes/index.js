
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
	//console.log('req.connection.remotePort', req.connection.remotePort);
	//console.log('req.connection.remoteAddress', req.connection.remoteAddress);
	//console.log('req.headers', req.headers);
	var tag = req.params.tag;
	console.log(tag);
	var adminPwd = req.body.adminpwd;
	var playerPwd = req.body.playerpwd;
	var maxNos = req.body.maxnos;
	res.send(housie.createGame(tag, adminPwd, playerPwd, maxNos));
};

exports.drawNumber = function(req, res){
	var tag = req.params.tag;
	var adminPwd = req.body.adminpwd;
	res.send(housie.drawNumber(tag, adminPwd));
};

exports.validateJoin = function(req, res){
	var tag = req.params.tag;
	console.log(tag);
	var playerName = req.body.playername;
	var gamePwd = req.body.gamepwd;
	var playerPwd = req.body.playerpwd;
	res.send(housie.validateJoin(tag, gamePwd, playerPwd, playerName));
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
	housie.issueTicket(tag, gamePwd, name, playerPwd, maxNo, rows, columns, numberCount, function(err, result) {
		if (err)
			res.send(err);
		else
			res.send(result);
			
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
