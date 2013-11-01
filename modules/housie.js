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

housie.prototype.drawNumber = function(tag, adminPwd, callback) {
	getGameAndValidateAccess(tag, 'Admin', adminPwd, function(err, game) {
		if (game.error || err)
			callback(err||game);
		else {
			game.drawNumber(function(err, thisGame) {
				db.put('game', thisGame.tag, thisGame);
				callback(err, getGameForPlayer(thisGame));
			});
		}	
	}); 
};

housie.prototype.validateJoin = function(tag, playPwd, playerPwd, playerName, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, playerName, function(err, game) {
		if (game.error) {
			callback(game);	
			return;
		}
		if (!game.players) 
			game.players = {};
		player = {};
		if (!game.players[playerName]) {
			if (game.gameStarted) {
				callback({'error': 'Game already commenced. New players cannot join after the commencement of the game.'});
				return;
			}
			player.password = playerPwd;
			player.tickets = [];
			game.players[playerName] = player;
		}
		player = game.players[playerName];
		if (player.password != playerPwd) {
			callback({'error': 'Player password incorrect.'});
			return;
		}
		db.put('game', tag, game);
		callback(null,getGameForPlayer(game));
	}); 
};

housie.prototype.createGame = function (tag, adminPwd, playPwd, maxNo, callback) {
	if (!tag || tag.length === 0) {
		callback({error:"Game 'tag' needed to create game."});
		return;
	}
	db.get('game', tag, function (err, game) {
		var error = err;
		if (game) {
			if (!(game.adminPwd === adminPwd && game.playPwd === playPwd))
				error = {error: 'An active game with same tag already exists. Please retry with a different tag.'};
		}
		if (!adminPwd) {
			error = {error: 'An administrator password is needed to create a game.'};
		}
		if (!playPwd) {
			error = {error: 'A player password is needed to create a game.'};
		}
		if (!error) {
			game = new Game(tag, adminPwd, playPwd, maxNo);
			db.put('game', tag, game);
			callback(null, getGameForPlayer(game));
		}
		else {
			callback(error);
		}
	});
};

housie.prototype.issueTicket = function (tag, playPwd, name, playerPwd, maxNo, rows, columns, numberCount, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, name, function(err, game) {
		if (game.error) {
			callback(game);
			return;
		}
		if (!game.players) 
			err = {error:'Player needs to join the game before tickets can be issued.'};
		if (!game.players[name]) 
			err = {error:'Player needs to join the game before tickets can be issued.'};
		if (!playerPasswordMatch(game.players[name], playerPwd)) 
			err = {error:'Player password does not match.'};
		if (game.gameStarted) 
			err = {error:'Game already commenced. New tickets cannot be issued after the commencement of the game'};
		if (!name || name.length === 0) 
			err = {error:"'name' needed to issue tickets"};
		if (err) {
			callback(err);
			return;
		}
		Ticket(maxNo, rows, columns, numberCount, function (err, ticket) {
			if (err) {
				callback(err);
				return;
			}
			ticket.tag = tag;
			ticket.name = name;
			var ticket_tag = tag + '_' + name + '_' + playerPwd;
			var tickets  = db.get('ticket', ticket_tag);
			if (!Array.isArray(tickets))
				tickets = [];
			tickets.push(ticket);
			db.put('ticket', ticket_tag, tickets);
			callback(null, tickets);		
		});
	}); 
};

housie.prototype.discardTicket = function (tag, name, playPwd, playerPwd) {
	getGameAndValidateAccess(tag, 'Game', playPwd, name, function(err, game) {
		if (game.error || err) {
			callback(err || game);
			return;
		}
		if (!playerPasswordMatch(game.players[name], playerPwd))
			err = {error:"Player password does not match"};
		if (!name || name.length === 0) {
			err = {error:"'name' needed to discard tickets"};
		}
		if (err) {
			callback(err);
			return;
		}
		var ticket_tag = tag + '_' + name + '_' + playerPwd;
		db.put('ticket', ticket_tag, []);
		callback(null, {message: 'Pending tickets discarded for '+ name + ' for the game ' + tag});
	}); 
};

housie.prototype.confirmTicket = function (tag, name, playPwd, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Game', playPwd, name); 
	if (game.error)
		return game;
	var player;
	if (game.players)
		player = game.players[name];
	if (!player)
		return {error:'Player not found!'};
	if (!playerPasswordMatch(player, playerPwd))
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
	return {message: 'Tickets confirmed. Total tickets count for ' + name + ' in game ' + tag + ' is ' + current_tickets.length, ticketCount: current_tickets.length};
};

housie.prototype.getTickets = function (tag, name, playPwd, playerPwd) {
	var game = getGameAndValidateAccess(tag, 'Game', playPwd, name); 
	if (game.error)
		return game;
	if (playerPasswordMatch(game.players[name],playerPwd))
		return game.players[name].tickets;	
	else
		return {error: 'Invalid player password.'};
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
	if (game.gameStarted) {
		callback ({error:'Game already commenced. Tickets cannot be confirmed after the commencement of the game'});
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

housie.prototype.getGame = function (tag, gamePwd) {
	var game = db.get('game', tag);
	if (!game)
		return ({exists: false});
	if (game.playPwd === gamePwd) {
		return ({exists: true, 'game': getGameForPlayer(game)});
	}
	else {
		return ({exists: true, error: "Incorrect Game password"});
	}
};

housie.prototype.gameStats = function (tag, adminPwd) {
	var stats = {};
	console.log(adminPwd, tag);
	var game = getGameAndValidateAccess(tag, 'Admin', adminPwd); 
	if (game.error)
		return game;
	//get number of players
	if (game.players) {
		var players = Object.keys(game.players);
		//get number of tickets for each player
		for (var i = 0; i < players.length; i++) {
			var player = {name: players[i], ticketCount: game.players[players[i]].tickets.length};
			players[i] = player;
		}
		stats.players = players;
	}
	//get numbers drawn, numbers pending
	stats.numbersPendingCount = game.pendingNumbers.length;
	stats.numbersDrawnCount = 0;
	for (var i=0; i<game.drawnNumbers.length; i++) {
		if (game.drawnNumbers[i])
			stats.numbersDrawnCount++;
	}
	return stats;
};

housie.prototype.gameList =  function (filter, New, callback) {
	db.get('game', null, function(err, games) {
		if (err) {
			callback(err);
			return;
		}
		var tags = [];
		if (games)
			tags = Object.keys(games);
		var list = [];
		for (var i = 0; i < tags.length; i++) {
			var tag = tags[i];
			if (tag.toLowerCase().indexOf(filter.toLowerCase()) > -1) {
				var game = games[tag];
				if (((New && !game.gameStarted) || (!New)) && !game.finished) {
					list.push(tag);
				}
			}
		}
		list.sort();
		callback(null, list);
	});
};

function getGameAndValidateAccess(tag, accessType, inPwd, name, callback) {
	if (!tag || tag.length === 0) {
		callback({error:"Missing game 'tag'."});
	}
	db.get('game', tag, function(err, Game) {
		if (err) {
			callback(err);
			return;
		}
		if (!Game) 
			err = {error: 'No game found with the tag. Either incorrect tag was provided or all the numbers have been drawn'};
		var gamePwd = '';
		if (accessType === 'Admin')
			gamePwd = Game.adminPwd;
		if (accessType === 'Game')
			gamePwd = Game.playPwd;
		if (inPwd !== gamePwd)
			err = {error: 'Invalid ' + accessType + ' password.'};
		if (accessType === 'Game' && (!name || name.length === 0))
			err = {error:"Player name required."};
		if ((accessType === "Game") && Game.gameStarted === true)
			if (!Game.players[name])
				err = {error:"Player cannot join/tickets issued after Game has started."};
		callback(err, (err ? null : Game));
	});
}

var getGameForPlayer = function(game) {
    var outGame = {tag:game.tag, pendingNumbers:game.pendingNumbers, drawnNumbers:game.drawnNumbers, finished:game.finished};
    if (game.number)
    	outGame.number = game.number;
    return outGame;
};

var playerPasswordMatch = function (player, playerPassword) {
	if (player.password === playerPassword)
		return true;
	else
		return false;
}

module.exports = function () {
	return new housie();
};