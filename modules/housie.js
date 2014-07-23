/**
 * New node file
 */
"option strict";

var config = require('./configuration');
var db = require('./dbaccess');
var Game = require('./game');
var Ticket = require('./ticket');
var numberCalls = require("./numberCalls");
var NumberCalls = new numberCalls();
var eventTypes = config.eventTypes;

var logTimer;

var housie = function () { 
	logTimer = setInterval(function() {
		db.get('game', null, false, loggerCallback);
	}, config.monitoringInterval);
};

housie.prototype.drawNumber = function(gameTag, adminPwd, callback) {
	getGameAndValidateAccess(gameTag, 'Admin', adminPwd, null, function(err, game) {
		if (err || game.error)
			return callback(err||game);
		else {
			if (game.finished) {
				callback(null, getGameForPlayer(game));
				return;
			}
			drawNumber(game, function(err, thisGame) {
				db.put('game', thisGame.gameTag, thisGame);
				db.append('log', {logTag: thisGame.gameTag, eventType: eventTypes.drawNumber, eventData: thisGame.number, eventDate: new Date()});
				if (thisGame.finished) {
					db.append('log', {logTag: thisGame.gameTag, eventType: eventTypes.finishGame, eventData: '', eventDate: new Date()});					
				}
				callback(err, getGameForPlayer(thisGame));
			});
		}	
	}); 
};

housie.prototype.finishGame = function(gameTag, adminPwd, callback) {
	getGameAndValidateAccess(gameTag, 'Admin', adminPwd, null, function(err, game) {
		if (err || game.error)
			return callback(err ? err : game);
		else {
			game.finished = true;
			db.put('game', game.gameTag, game);
			callback(null, getGameForPlayer(game));
		}	
	}); 
};

housie.prototype.validateJoin = function(gameTag, playPwd, playerPwd, playerName, callback) {
	getGameAndValidateAccess(gameTag, 'Game', playPwd, playerName, function(err, game) {
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
			callback({'error': 'Player password incorrect or another player with the same name is already in the game.'});
			return;
		}
		db.put('game', gameTag, game);
		if (playerExists)
			db.append('log', {logTag: gameTag, eventType: eventTypes.playerRejoin, eventData: playerName, eventDate: new Date()});
		else
			db.append('log', {logTag: gameTag, eventType: eventTypes.playerJoin, eventData: playerName, eventDate: new Date()});
		callback(null,getGameForPlayer(game));
	}); 
};

housie.prototype.createGame = function (gameTag, adminPwd, playPwd, maxNo, callback) {
	if (!gameTag || gameTag.length === 0) {
		callback({error:"Game 'tag' needed to create game."});
		return;
	}
	db.get('game', gameTag, true, function (err, game) {
		var error = err;
		if (game) {
			if (!(game.adminPwd === adminPwd && game.playPwd === playPwd))
				error = {error: 'An active game with same game tag already exists. Please retry with a different game tag.'};
		}
		if (!adminPwd) {
			error = {error: 'An administrator password is needed to create a game.'};
		}
		if (!playPwd) {
			error = {error: 'A player password is needed to create a game.'};
		}
		if (!error) {
			if (!game) {
				game = new Game(gameTag, adminPwd, playPwd, maxNo);
				//console.log("Game just after creation : ", JSON.stringify(game));
				db.put('game', gameTag, game);
				db.append('log', {logTag: gameTag, eventType: eventTypes.createGame, eventData: "", eventDate: new Date()});
			}
			else
				db.append('log', {logTag: gameTag, eventType: eventTypes.continueGame, eventData: "Run", eventDate: new Date()});
			callback(null, getGameForPlayer(game));
		}
		else {
			callback(error);
		}
	});
};

housie.prototype.issueTicket = function (gameTag, playPwd, name, playerPwd, maxNo, rows, columns, numberCount, callback) {
	getGameAndValidateAccess(gameTag, 'Game', playPwd, name, function(err, game) {
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
			var ticketTag = gameTag + '_' + name + '_' + playerPwd;
			db.get('ticket', ticketTag, true, function (err, result) {
				if (!result) {
					result = {'ticketTag': ticketTag, tickets: []};
					result.gameTag = gameTag;
					result.name = name;
				}
				tickets = result.tickets;
				tickets.push(ticket);
				result.tickets = tickets;
				db.put('ticket', ticketTag, result);
				db.append('log', {logTag: gameTag, eventType: eventTypes.issueTicket, eventData: name, eventDate: new Date()});
				callback(null, tickets);						
			});
		});
	}); 
};

housie.prototype.discardTicket = function (gameTag, name, playPwd, playerPwd, callback) {
	getGameAndValidateAccess(gameTag, 'Game', playPwd, name, function(err, game) {
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
		var ticketTag = gameTag + '_' + name + '_' + playerPwd;
		db.get('ticket', ticketTag, true, function (err, result) {
			if (result) {
				result.tickets = [];
				db.put('ticket', ticketTag, result);
			}
			db.append('log', {logTag: gameTag, eventType: eventTypes.discardTicket, eventData: name, eventDate: new Date()});
			callback(null, {message: 'Pending tickets discarded for '+ name + ' for the game ' + gameTag});
		});
	}); 
};

housie.prototype.confirmTicket = function (gameTag, name, playPwd, playerPwd, callback) {
	getGameAndValidateAccess(gameTag, 'Game', playPwd, name, function(err, game) {
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
		var ticketTag = gameTag + '_' + name + '_' + playerPwd;
		var current_tickets = game.players[name].tickets;
		if (!current_tickets)
			current_tickets = [];
		db.get('ticket', ticketTag, true, function(err, result) {
			var msg;
			if (result) {
				var pending_tickets = result.tickets;
				if (!pending_tickets)
					pending_tickets = [];
				current_tickets = current_tickets.concat(pending_tickets);
				game.players[name].tickets = current_tickets;
				db.put('game', gameTag, game);
				result.tickets = [];
				db.put('ticket', ticketTag, result);
				msg = {message: 'Tickets confirmed. Total tickets count for ' + name + ' in game ' + gameTag + ' is ' + current_tickets.length, ticketCount: current_tickets.length};
			}
			else {
				msg = {message: 'No pending tickets found to confirm. Total tickets count for ' + name + ' in game ' + gameTag + ' is ' + current_tickets.length, ticketCount: current_tickets.length};
			}
			db.append('log', {logTag: gameTag, eventType: eventTypes.confirmTicket, eventData: name, eventDate: new Date()});
			callback(null, msg);	
		});
	}); 
};

housie.prototype.getTickets = function (gameTag, name, playPwd, playerPwd, callback) {
	getGameAndValidateAccess(gameTag, 'Game', playPwd, name, function(err, game) {
		db.append('log', {logTag: gameTag, eventType: eventTypes.getTicket, eventData: name, eventDate: new Date()});
		if (err || game.error)
			return callback(err ? err : game);
		if (playerPasswordMatch(game.players[name],playerPwd)) {
			return callback(null, game.players[name].tickets);	
		}
		else
			return callback({error: 'Invalid player password.'});
	}); 
};

housie.prototype.getTicketsForPrint = function (gameTag, adminPwd, qty, callback) {
	if (gameTag && gameTag.length > 0) {
		getGameAndValidateAccess(gameTag, 'Admin', adminPwd, null, function(err, game) {
			if (err || game.error) {
				callback(err || game);
				return;
			}
			if (game.gameStarted) {
				callback ({error:'Game already commenced. Tickets cannot be confirmed after the commencement of the game'});
				return;
			}
			var cb = function (err, tickets) {
				if (err) {
					callback(err);
					return;
				}
				if (game) {
					var printTickets = game.printTickets;
					if (!printTickets)
						printTickets = [];
					printTickets = printTickets.concat(tickets);
					game.printTickets = printTickets;
					db.put('game', game.gameTag, game);
					db.append('log', {logTag: gameTag, eventType: eventTypes.ticketsPrint, eventData: qty, eventDate: new Date()});
				}
				callback(null, tickets);
			};
			ticketsForPrint(qty, cb);
		});
	}
	else {
		ticketsForPrint(qty, callback);
	}
};

housie.prototype.getGame = function (gameTag, gamePwd, callback) {
	db.get('game', gameTag, true, function(err, game) {
		if (game && Array.isArray(game) && game.length > 0) {
			game = game[0];
		}
		db.append('log', {logTag: gameTag, eventType: eventTypes.getGame, eventData: "", eventDate: new Date()});
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

housie.prototype.gameStats = function (gameTag, adminPwd, callback) {
	var stats = {};
	getGameAndValidateAccess(gameTag, 'Admin', adminPwd, null, function (err, game) {
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
		db.append('log', {logTag: gameTag, eventType: eventTypes.getStats, eventData: "", eventDate: new Date()});
		callback(err, stats);
	}); 
};

housie.prototype.gameList =  function (filter, New, callback) {
	db.get('game', null, false, function(err, games) {
		if (err) {
			callback(err);
			return;
		}
		if (!games) {
			games = [];
		}
		if (games && !Array.isArray(games)) {
			games = [games];
		}
		var list = [];
		for (var i = 0; i < games.length; i++) {
			var gameTag = games[i].gameTag;
			if (gameTag.toLowerCase().indexOf(filter.toLowerCase()) > -1) {
				var game = games[i];
				if (((New && !game.gameStarted) || (!New)) && !game.finished) {
					list.push(gameTag);
				}
			}
		}
		list.sort();
		db.append('log', {logTag: 'app', eventType: eventTypes.getList, eventData: list.length, eventDate: new Date()});
		callback(null, list);
	});
};

housie.prototype.checkGameList =  function (list, callback) {
	db.get('game', null, false, function(err, games) {
		if (err) {
			callback(err);
			return;
		}
		if (!games) {
			callback(null, []);
			return;
		}
		var gamesCollection = {};
		for (var i = 0; i < games.length; i++) {
			gamesCollection[games[i].gameTag] = games[i];
		}
		for (var i = list.length-1; i > -1; i--) {
			var gameTag = list[i];
			var game = gamesCollection[gameTag];
			if (!game || game.finished) {
				list.splice(i, 1);
			}
		}
		list.sort();
		db.append('log', {logTag: 'app', eventType: eventTypes.checkList, eventData: list.length, eventDate: new Date()});
		callback(null, list);
	});
};

housie.prototype.log =  function (gameTag, adminPwd, callback) {
	getGameAndValidateAccess(gameTag, 'Admin', adminPwd, null , function (err, game) {
		if (err || game.error) {
			return callback(err || game.error);
		}
		db.get('log', gameTag, false, function (err, log) {
			callback(err, log);
		});
	});
};

function getGameAndValidateAccess(gameTag, accessType, inPwd, name, callback) {
	if (!gameTag || gameTag.length === 0) {
		callback({error:"Missing game 'tag'."});
	}
	db.get('game', gameTag, true, function(err, Game) {
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
    var outGame = {gameTag:game.gameTag, pendingNumbers:game.pendingNumbers, drawnNumbers:game.drawnNumbers};
    if (game.number) {
    	outGame.number = game.number;
    	outGame.numberCall = NumberCalls.getCall(game.number);
    }
    if (game.finished) {
    	outGame.finished = game.finished;
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
	games = cleanGames(games, games.length, function (err, games) {
		var playerCount = 0;
		for (var i = 0; i < games.length; i++) {
			var game = games[i];
			if (game && !game.finished && game.players) {
				playerCount = playerCount + Object.keys(game.players).length;
			}
		}
		//console.log("{Monitoring log: {Time: " + new Date(), ", Game count: " + gameTags.length + ", Player Count: "+ playerCount+"}}");
		db.append('log', {logTag: 'app', eventType: eventTypes.monitoring, gameCount: games.length, playerCount: playerCount});
	});
};

var cleanGames = function (games, iteration, callback) {
	if (iteration === 0) {
		callback(null, games);
		return;
	}	
	var idx = iteration-1
	var game = games[idx];
	var gameTag = game.gameTag;
	db.get('log', gameTag, false, function (err, log) {
		lastLog = log[log.length-1];
		var deleteFlag = false;
		//console.log('age',(new Date() - lastLog.eventDate));
		if (new Date()-lastLog.eventDate > config.inactivityWait) {
			deleteFlag = true;
		}
		//console.log('finish',(new Date() - game.finishDate));
		
		if (game.finished && (new Date() - game.finishDate) > config.finishWait) {
			deleteFlag = true;
		}
		if (deleteFlag) {
			//console.log('deleting ', gameTag);
			db.remove('game', gameTag);
			games.splice[idx];
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

var drawNumber = function (game, callback) {
    //Draw number from remaining numbers
    if (!game.finished) {
        var idx = Math.floor(Math.random() * game.pendingNumbers.length);
        var num = game.pendingNumbers.splice(idx, 1)[0];
        game.drawnNumbers[num - 1] = num;
        game.gamePctFinished = Math.round((1 - game.pendingNumbers.length / game.maxNo) * 100);
        game.gameStarted = true;
        if (game.pendingNumbers.length === 0) {
            game.finished = true;
            game.finishDate = new Date();
        }
        game.number = num;
    }
    game.lastAccessDate = new Date();
    callback(null, game);
};

var ticketsForPrint = function (count, callback) {
	var tickets = [];
	var cb = function (err, result) {
		tickets.push(result);
	};
	for (var i = 0; i < count; i++) {
		Ticket(null,null,null,null, cb);
	}
	while (tickets.length !=count) {
		//console.log('XXXXXXXXXXXX');
	}
	callback(null, tickets);
};

module.exports = function () {
	return new housie();
};