/**
 * New node file
 */
"option strict";

var Datastore = require('./datastore');
var db = new Datastore();
var Game = require('./game');
var Ticket = require('./ticket');

var housie = function () { 
	
};

housie.prototype.drawNumber = function(tag, adminPwd) {
	var game = getGameAndValidateAccess(tag, 'Admin', adminPwd); 
	if (game.error)
		return game;
	else {
		game = game.drawNumber();
		db.put('game', game.tag, game);
		return getGameForPlayer(game);
	}
	
};

housie.prototype.validateJoin = function(tag, playPwd, playerPwd, playerName) {
	var game = getGameAndValidateAccess(tag, 'Player', playPwd, playerName); 
	if (game.error)
		return game;
	if (game.gameStarted)
		return {'error': 'Game already commenced. New players cannot join after the commencement of the game.'};
	if (game.players && game.players[playerName])
		if (playerPwd != game.players[playerName].password)
			return {'error': 'Game password incorrect.'};
	if (!game.players) 
		game.players = {};
	player = {};
	if (!game.players[playerName]) {
		player.password = playerPwd;
		player.tickets = [];
		game.players[playerName] = player;
	}
	player = game.players[playerName];
	if (player.password != playerPwd)
		return {'error': 'Player password incorrect.'};
	db.put('game', tag, game);
	return getGameForPlayer(game);
};

housie.prototype.createGame = function (tag, adminPwd, playPwd, maxNo) {
	if (!tag || tag.length === 0) {
		return {error:"Game 'tag' needed to create game."};
	}
	var game = db.get('game', tag);
	if (game) {
		return {error: 'An active game with same tag already exists. Please retry with a different tag.'};
	}
	if (!adminPwd) {
		return {error: 'An administrator password is needed to create a game.'};
	}
	if (!playPwd) {
		return {error: 'A player password is needed to create a game.'};
	}
	else {
		game = new Game(tag, adminPwd, playPwd, maxNo);
		db.put('game', tag, game);
		return getGameForPlayer(game);
	}
};

housie.prototype.issueTicket = function (tag, playPwd, name, playerPwd, maxNo, rows, columns, numberCount, callback) {
	var game = getGameAndValidateAccess(tag, 'Player', playPwd, name); 
	if (game.error) {
		callback(game);
		return;
	}
	if (!game.players) {
		callback({error:'Player needs to join the game before tickets can be issued.'});
		return;
	}
	if (!game.players[name]) {
		callback({error:'Player needs to join the game before tickets can be issued.'});
		return;
	}
	if (game.gameStarted) {
		callback({error:'Game already commenced. New tickets cannot be issued after the commencement of the game'});
		return;
	}
	if (!name || name.length === 0) {
		callback({error:"'name' needed to issue tickets"});
		return;
	}
	Ticket(maxNo, rows, columns, numberCount, function (err, ticket) {
		console.log('Ticket', ticket);
		ticket.tag = tag;
		ticket.name = name;
		var ticket_tag = tag + '_' + name + '_' + playerPwd;
		var tickets  = db.get('ticket', ticket_tag);
		if (!Array.isArray(tickets))
			tickets = [];
		tickets.push(ticket);
		db.put('ticket', ticket_tag, tickets);
		callback(err, tickets);		
	});
};

housie.prototype.discardTicket = function (tag, name, playPwd, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Player', playPwd, name); 
	if (game.error)
		return game;
	if (game.error)
		return game;
	if (!name || name.length === 0) {
		return {error:"'name' needed to discard tickets"};
	}
	var ticket_tag = tag + '_' + name + '_' + playerPwd;
	db.put('ticket', ticket_tag, []);
	return {message: 'Pending tickets discarded for '+ name + ' for the game ' + tag};
};

housie.prototype.confirmTicket = function (tag, name, playPwd, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Player', playPwd, name); 
	if (game.error)
		return game;
	var player;
	if (game.players)
		player = game.players[name];
	if (!player)
		return {error:'Player not found!'};
	if (player.password != playerPwd)
		return {error:'Player password does not match!'};
	if (game.gameStarted) {
		return {error:'Game already commenced. Tickets cannot be confirmed after the commencement of the game'};
	}
	var ticket_tag = tag + '_' + name + '_' + playerPwd;
	var pending_tickets = db.get('ticket', ticket_tag);
	if (!pending_tickets)
		pending_tickets = [];
	var current_tickets = game.players[name].tickets;
	if (!current_tickets)
		current_tickets = [];
	current_tickets = current_tickets.concat(pending_tickets);
	game.players[name].tickets = current_tickets;
	db.put('game', tag, game);
	db.put('ticket', ticket_tag, []);
	return {message: 'Tickets confirmed. Total tickets count for ' + name + ' in game ' + tag + ' is ' + current_tickets.length};
};

housie.prototype.getTickets = function (tag, name, playPwd) {
	var game = getGameAndValidateAccess(tag, 'Player', playPwd, name); 
	if (game.error)
		return game;
	return game.players[name].tickets;	
};

housie.prototype.getTicketsForPrint = function (tag, adminPwd, qty, callback) {
	var tickets = [];
	var game = {};
	if (tag && tag.length === 0)
		game = getGameAndValidateAccess(tag, 'Admin', adminPwd); 
	if (game && game.error) {
		callback(game);
		return;
	}
	var cb = function (err, result) {
		tickets.push(result);
	};
	for (var i = 0; i < qty; i++) {
		Ticket(null,null,null,null, cb);
	}
	while (tickets.length !=qty) {
		//console.log('XXXXXXXXXXXX');
	}
	if (game) {
		var printTickets = game.printTickets;
		if (!printTickets)
			printTickets = [];
		printTickets = printTickets.concat(tickets);
		game.printTickets = printTickets;
	}
	db.put('game', game.tag, game);
	callback(null, tickets);
};

function getGameAndValidateAccess(tag, accessType, inPwd, name) {
	if (!tag || tag.length === 0) {
		return {error:"Missing game 'tag'."};
	}
	var Game = db.get('game', tag);
	if (!Game) 
		return {error: 'No game found with the tag. Either incorrect tag was provided or all the numbers have been drawn'};
	var gamePwd = '';
	if (accessType === 'Admin')
		gamePwd = Game.adminPwd;
	if (accessType === 'Player')
		gamePwd = Game.playPwd;
	if (inPwd !== gamePwd)
		return {error: 'Invalid ' + accessType + ' password.'};
	if (accessType === 'Player' && (!name || name.length === 0))
		return {error:"Player name required."};
	if ((accessType === "Player") && Game.gameStarted === true)
		if (!game.players[name])
			return {error:"Player cannot join/tickets issued after Game has started."};
	return Game;	
}

var getGameForPlayer = function(game) {
    var outGame = {tag:game.tag, pendingNumbers:game.pendingNumbers, drawnNumbers:game.drawnNumbers, finished:game.finished};
    if (game.number)
    	outGame.number = game.number;
    return outGame;
};

module.exports = function () {
	return new housie();
};