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

housie.prototype.drawNumber = function(tag, pwd) {
	var game = db.get('game', tag);
	if (game) {
		if (game.pwd == pwd)
			return game.drawNumber();
		else
			return {error: 'Invalid game password'};
	}
	else
		return {error: 'No game found with the tag. Either incorrect tag was provided or all the numbers have been drawn'};
};

housie.prototype.createGame = function (tag, pwd, maxNo) {
	var game = db.get('game', tag);
	if (game) {
		return {error: 'An active game with same tag already exists. Please retry with a different tag.'};
	}
	if (!pwd) {
		return {error: 'An administrator password is needed to create a game.'};
	}
	else {
		game = new Game(tag, pwd, maxNo);
		db.put('game', tag, game);
	    return {tag:game.tag, pendingNumbers:game.pendingArr, drawnNumbers:game.drawnArr, finished:game.gameFinished};
	}
};

housie.prototype.issueTicket = function (tag, name, maxNo, rows, columns, numberCount) {
	var game = db.get('game', tag);
	if (!game) {
		return {error: 'No game found with the tag.'};
	}
	if (game.gameStarted) {
		return {error:'Game already commenced. New tickets cannot be issued after the commencement of the game'};
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

housie.prototype.discardTicket = function (tag, name) {
	var ticket_tag = tag + '_' + name;
	db.put('ticket', ticket_tag, []);
	return {message: 'Pending tickets discarded for '+ name + ' for the game ' + tag};
};

housie.prototype.confirmTicket = function (tag, name) {
	var ticket_tag = tag + '_' + name;
	var pending_tickets = db.get('ticket', ticket_tag);
	if (!pending_tickets)
		pending_tickets = [];
	var game = db.get('game', tag);
	if (!game.tickets)
		game.tickets = {};
	var current_tickets = game.tickets[name];
	if (!current_tickets)
		current_tickets = [];
	current_tickets = current_tickets.concat(pending_tickets);
	game.tickets[name] = current_tickets;
	db.put('ticket', ticket_tag, []);
	return {message: 'Tickets confirmed. Total tickets count for ' + name + ' in game ' + tag + ' is ' + current_tickets.length};
};

housie.prototype.getTickets = function (tag, name) {
	var game = db.get('game', tag);
	if (!game) {
		return {error: 'No game found with the tag.'};
	}
	return game.tickets[name];	
};

housie.prototype.getTicketsForPrint = function (tag, qty, callback) {
	var tickets = [];
	var game = null;
	if (tag) {
		game = db.get('game', tag);
		if (!game) {
			callback({error: 'No game found with the tag.'});
		}
	}
	for (var i = 0; i < qty; i++) {
		tickets.push(new Ticket());
	}
	if (game) {
		var printTickets = game.printTickets;
		if (!printTickets)
			printTickets = [];
		printTickets = printTickets.concat(tickets);
		game.printTickets = printTickets;
	}
	callback(tickets);
};

function validateGameAccess(accessType, input) {
	
}

module.exports = function () {
	return new housie();
};