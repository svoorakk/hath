var socketio;
var db = require('./dbaccess');

var socketServer = function (io) {
	socketio = io;
	socketio.sockets.on('connection', function (socket) {
		socket.emit('welcome', { message: 'Welcome to housie@home' });
		socket.on('joinGame', function (game) {
			//console.log(game);
			//TODO: validation
			socket.player = game.playerName;
			socket.gameTag = game.gameTag;
			socket.join(game.gameTag);
		});
		socket.on('runGame', function (game) {
			//console.log(game);
			//TODO: validation
			socket.player = 'Admin';
			socket.gameTag = game.gameTag;
			socket.join(game.gameTag);
		});
		socket.on('chatMessage', function (message) {
			//console.log(message);
			//TODO: validation
			//save to db
			var chatMessage = {'game': socket.gameTag, 'timeStamp': new Date(), 'sender':socket.player, 'message':message};
			db.append('chat', chatMessage);
			//socket.broadcast.to(socket.gameTag).emit('chatMessage', {'timeStamp': new Date(), 'sender':socket.player, 'message':message});
			this.broadcast(socket.gameTag, 'chatMessage', chatMessage);
		});
	});
};

socketServer.prototype.clearRoom = function(gameTag) {
	var sockets = socketio.sockets.clients(gameTag);
	for (var i = 0; i < sockets.length; i++) {
		sockets[i].leave(gameTag);
	}
};

socketServer.prototype.broadcast = function(gameTag, eventName, message) {
	socketio.sockets.in(gameTag).emit(eventName, message);
};

module.exports = function (io) {
	return new socketServer(io);
};