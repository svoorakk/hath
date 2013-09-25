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
		return getGameForClient(game);
	}
	
};

housie.prototype.validateJoin = function(tag, playerPwd, playerName) {
	var game = getGameAndValidateAccess(tag, 'Player', playerPwd, playerName); 
	if (game.error)
		return game;
	if (game.gameStarted)
		return {'error': 'Game already commenced. New players cannot join after the commencement of the game.'};
	if (game.tickets && game.tickets[playerName])
		return {'error': 'Player already joined or another player with same name is already in the game.'};
	if (!game.tickets)
		game.tickets = {};
	game.tickets[playerName] = [];
	db.put('game', tag, game);
	return getGameForClient(game);
};

housie.prototype.createGame = function (tag, adminPwd, playerPwd, maxNo) {
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
	if (!playerPwd) {
		return {error: 'A player password is needed to create a game.'};
	}
	else {
		game = new Game(tag, adminPwd, playerPwd, maxNo);
		db.put('game', tag, game);
		return getGameForClient(game);
	}
};

housie.prototype.issueTicket = function (tag, name, playerPwd, maxNo, rows, columns, numberCount) {
	var game = getGameAndValidateAccess(tag, 'Player', playerPwd, name); 
	if (game.error)
		return game;
	if (game.gameStarted) {
		return {error:'Game already commenced. New tickets cannot be issued after the commencement of the game'};
	}
	if (!name || name.length === 0) {
		return {error:"'name' needed to issue tickets"};
	}
	var ticket = new Ticket(maxNo, rows, columns, numberCount);
	ticket.tag = tag;
	ticket.name = name;
	var ticket_tag = tag + '_' + name;
	var tickets  = db.get('ticket', ticket_tag);
	if (!Array.isArray(tickets))
		tickets = [];
	tickets.push(ticket);
	db.put('ticket', ticket_tag, tickets);
	return tickets;
};

housie.prototype.discardTicket = function (tag, name, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Player', playerPwd, name); 
	if (game.error)
		return game;
	if (game.error)
		return game;
	if (!name || name.length === 0) {
		return {error:"'name' needed to discard tickets"};
	}
	var ticket_tag = tag + '_' + name;
	db.put('ticket', ticket_tag, []);
	return {message: 'Pending tickets discarded for '+ name + ' for the game ' + tag};
};

housie.prototype.confirmTicket = function (tag, name, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Player', playerPwd, name); 
	if (game.error)
		return game;
	if (game.gameStarted) {
		return {error:'Game already commenced. Tickets cannot be confirmed after the commencement of the game'};
	}
	var ticket_tag = tag + '_' + name;
	var pending_tickets = db.get('ticket', ticket_tag);
	if (!pending_tickets)
		pending_tickets = [];
	if (!game.tickets)
		game.tickets = {};
	var current_tickets = game.tickets[name];
	if (!current_tickets)
		current_tickets = [];
	current_tickets = current_tickets.concat(pending_tickets);
	game.tickets[name] = current_tickets;
	db.put('game', tag, game);
	db.put('ticket', ticket_tag, []);
	return {message: 'Tickets confirmed. Total tickets count for ' + name + ' in game ' + tag + ' is ' + current_tickets.length};
};

housie.prototype.getTickets = function (tag, name, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Player', playerPwd, name); 
	if (game.error)
		return game;
	return game.tickets[name];	
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
	callback(tickets);
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
		gamePwd = Game.playerPwd;
	if (inPwd !== gamePwd)
		return {error: 'Invalid ' + accessType + ' password.'};
	if (accessType === 'Player' && (!name || name.length === 0))
		return {error:"Player name required."};
	if ((accessType === "Player") && Game.gameStarted === true)
		if (!game.tickets[name])
			return {error:"Player cannot join after Game has started."};
	return Game;	
}

var getGameForClient = function(game) {
    var outGame = {tag:game.tag, pendingNumbers:game.pendingNumbers, drawnNumbers:game.drawnNumbers, finished:game.finished};
    if (game.number)
    	outGame.number = game.number;
    return outGame;
};

module.exports = function () {
	return new housie();
};