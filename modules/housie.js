/**
 * New node file
 */
"option strict";

var Datastore = require('./datastore');
var db = new Datastore();
var Game = require('./game');
var Ticket = require('./ticket');
var numberCalls = require("./numberCalls");
var NumberCalls = new numberCalls();

var logTimer;

var housie = function () { 
	logTimer = setInterval(function() {
		db.get('game', null, loggerCallback);
	}, 20000);
};

housie.prototype.drawNumber = function(tag, adminPwd, callback) {
	getGameAndValidateAccess(tag, 'Admin', adminPwd, null, function(err, game) {
		if (err || game.error)
			return callback(err||game);
		else {
			game.drawNumber(function(err, thisGame) {
				db.put('game', thisGame.tag, thisGame);
				db.append('log', thisGame.tag, {eventType: 'Draw Number', eventData: thisGame.number, eventDate: new Date()});
				callback(err, getGameForPlayer(thisGame));
			});
		}	
	}); 
};

housie.prototype.validateJoin = function(tag, playPwd, playerPwd, playerName, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, playerName, function(err, game) {
		if (err || game.error) {
			callback(err || game);	
			return;
		}
		if (!game.players) 
			game.players = {};
		player = {};
		var playerExists = true;
		if (!game.players[playerName]) {
			if (game.gameStarted) {
				callback({'error': 'Game already commenced. New players cannot join after the commencement of the game.'});
				return;
			}
			playerExists = false;
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
		if (playerExists)
			db.append('log', tag, {eventType: 'Player re-join', eventData: playerName, eventDate: new Date()});
		else
			db.append('log', tag, {eventType: 'Player join', eventData: playerName, eventDate: new Date()});
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
			if (!game) {
				game = new Game(tag, adminPwd, playPwd, maxNo);
				db.put('game', tag, game);
				db.append('log', tag, {eventType: 'Create Game', eventData: "", eventDate: new Date()});
			}
			else
				db.append('log', tag, {eventType: 'Continue Game', eventData: "Run", eventDate: new Date()});
			callback(null, getGameForPlayer(game));
		}
		else {
			callback(error);
		}
	});
};

housie.prototype.issueTicket = function (tag, playPwd, name, playerPwd, maxNo, rows, columns, numberCount, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, name, function(err, game) {
		if (err || game.error) {
			callback(err || game);
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
			db.get('ticket', ticket_tag, function (err, tickets) {
				if (!Array.isArray(tickets))
					tickets = [];
				tickets.push(ticket);
				db.put('ticket', ticket_tag, tickets);
				db.append('log', tag, {eventType: 'Issue Ticket', eventData: name, eventDate: new Date()});
				callback(null, tickets);						
			});
		});
	}); 
};

housie.prototype.discardTicket = function (tag, name, playPwd, playerPwd, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, name, function(err, game) {
		if (err || game.error) {
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
		db.append('log', tag, {eventType: 'Discard Ticket', eventData: name, eventDate: new Date()});
		callback(null, {message: 'Pending tickets discarded for '+ name + ' for the game ' + tag});
	}); 
};

housie.prototype.confirmTicket = function (tag, name, playPwd, playerPwd, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, name, function(err, game) {
		if (err || game.error)
			return callback(err || game);
		var player;
		if (game.players)
			player = game.players[name];
		if (!player)
			err = {error:'Player not found!'};
		if (!playerPasswordMatch(player, playerPwd))
			err = {error:'Player password does not match!'};
		if (game.gameStarted) {
			err = {error:'Game already commenced. Tickets cannot be confirmed after the commencement of the game'};
		}
		if (err)
			return callback(err);
		var ticket_tag = tag + '_' + name + '_' + playerPwd;
		db.get('ticket', ticket_tag, function(err, pending_tickets) {
			if (!pending_tickets)
				pending_tickets = [];
			var current_tickets = game.players[name].tickets;
			if (!current_tickets)
				current_tickets = [];
			current_tickets = current_tickets.concat(pending_tickets);
			game.players[name].tickets = current_tickets;
			db.put('game', tag, game);
			db.put('ticket', ticket_tag, []);
			db.append('log', tag, {eventType: 'Confirm Ticket', eventData: name, eventDate: new Date()});
			callback(null, {message: 'Tickets confirmed. Total tickets count for ' + name + ' in game ' + tag + ' is ' + current_tickets.length, ticketCount: current_tickets.length});			
		});
	}); 
};

housie.prototype.getTickets = function (tag, name, playPwd, playerPwd, callback) {
	getGameAndValidateAccess(tag, 'Game', playPwd, name, function(err, game) {
		db.append('log', tag, {eventType: 'Get Tickets', eventData: name, eventDate: new Date()});
		if (err || game.error)
			return callback(err || game);
		if (playerPasswordMatch(game.players[name],playerPwd))
			return callback(null, game.players[name].tickets);	
		else
			return callback({error: 'Invalid player password.'});
	}); 
};

housie.prototype.getTicketsForPrint = function (tag, adminPwd, qty, callback) {
	if (tag && tag.length > 0) {
		getGameAndValidateAccess(tag, 'Admin', adminPwd, null, function(err, game) {
			var tickets = [];
			if (err || game.error) {
				callback(err || game);
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
			db.append('log', tag, {eventType: 'Tickets Print', eventData: qty, eventDate: new Date()});
			callback(null, tickets);
		});
	}
	else
		callback({error:'Invalid game tag'});
};

housie.prototype.getGame = function (tag, gamePwd, callback) {
	db.get('game', tag, function(err, game) {
		db.append('log', tag, {eventType: 'Get Game', eventData: "", eventDate: new Date()});
		if (err) 
			return callback(err);
		if (!game)
			return callback(null, {exists: false});
		if (game.playPwd === gamePwd) {
			return callback(null, {exists: true, 'game': getGameForPlayer(game)});
		}
		else {
			return callback(null, {exists: true, error: "Incorrect Game password"});
		}
	});
};

housie.prototype.gameStats = function (tag, adminPwd, callback) {
	var stats = {};
	getGameAndValidateAccess(tag, 'Admin', adminPwd, null, function (err, game) {
		if (err || game.error)
			return callback(err ? err : game);
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
		if (game.printTickets)
			stats.printTicketCount = game.printTickets.length;
		else
			stats.printTicketCount = 0;
		db.append('log', tag, {eventType: 'Get Stats', eventData: "", eventDate: new Date()});
		callback(err, stats);
	}); 
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
		db.append('log', 'app', {eventType: 'Get List', eventData: list.length, eventDate: new Date()});
		callback(null, list);
	});
};

housie.prototype.checkGameList =  function (list, callback) {
	db.get('game', null, function(err, games) {
		if (err) {
			callback(err);
			return;
		}
		if (!games) {
			callback([]);
			return;
		}
		for (var i = list.length-1; i > -1; i--) {
			var tag = list[i];
			var game = games[tag];
			if (!game || game.finished) {
				list.splice(i, 1);
			}
		}
		list.sort();
		db.append('log', 'app', {eventType: 'Check List', eventData: list.length, eventDate: new Date()});
		callback(null, list);
	});
};

housie.prototype.log =  function (tag, adminPwd, callback) {
	getGameAndValidateAccess(tag, 'Admin', adminPwd, null , function (err, game) {
		if (err || game.error) {
			return callback(err || game.error);
		}
		db.get('log', tag, function (err, log) {
			callback(err, log);
		});
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
		if (!err && accessType === 'Admin')
			gamePwd = Game.adminPwd;
		if (!err & accessType === 'Game')
			gamePwd = Game.playPwd;
		if (!err && inPwd !== gamePwd)
			err = {error: 'Invalid ' + accessType + ' password.'};
		if (accessType === 'Game' && (!name || name.length === 0))
			err = {error:"Player name required."};
		if (!err && (accessType === "Game") && Game.gameStarted === true)
			if (!Game.players && !Game.players[name])
				err = {error:"Player cannot join/tickets issued after Game has started."};
		callback(err, (err ? null : Game));
	});
}

var getGameForPlayer = function(game) {
    var outGame = {tag:game.tag, pendingNumbers:game.pendingNumbers, drawnNumbers:game.drawnNumbers, finished:game.finished};
    if (game.number) {
    	outGame.number = game.number;
    	outGame.numberCall = NumberCalls.getCall(game.number);
    }
    
    return outGame;
};

var playerPasswordMatch = function (player, playerPassword) {
	if (player.password === playerPassword)
		return true;
	else
		return false;
};

var loggerCallback = function (err, games) {
	var gameTags = [];
	if (games) {
		gameTags = Object.keys(games);
	}
	games = cleanGames(games, gameTags.length, function (err, games) {
		var playerCount = 0;
		for (var i = 0; i < gameTags.length; i++) {
			var game = games[gameTags[i]];
			if (game && !game.finished && game.players) {
				playerCount = playerCount + Object.keys(game.players).length;
			}
		}
		console.log("{Monitoring log: {Time: " + new Date(), ", Game count: " + gameTags.length + ", Player Count: "+ playerCount+"}}");
		db.append('log', 'app', {eventType: "Monitoring", gameCount: gameTags.length, playerCount: playerCount});
	});
};

var cleanGames = function (games, iteration, callback) {
	if (iteration == 0) {
		callback(null, games);
		return;
	}	var tag = Object.keys(games)[iteration-1];
	db.get('log', tag, function (err, log) {
		lastLog = log[log.length-1];
		var deleteFlag = false;
		console.log('age',(new Date() - lastLog.eventDate));
		if (new Date()-lastLog.eventDate > 86400000) {
			deleteFlag = true;
		}
		var game = games[tag];
		console.log('finish',(new Date() - game.finishDate));
		
		if (game.finished && (new Date() - game.finishDate) > 3600000) {
			deleteFlag = true;
		}
		if (deleteFlag) {
			console.log('deleting ', tag);
			db.remove('game', tag);
			delete games[tag];
		}
		iteration--;
		if (iteration > 0) {
			cleanGames(games, iteration, callback);
		}
		else {
			callback(null, games);
		}
	});
};


module.exports = function () {
	return new housie();
};