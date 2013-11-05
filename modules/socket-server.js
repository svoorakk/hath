var socketio;

var socketServer = function (io) {
	socketio = io;
	socketio.sockets.on('connection', function (socket) {
		socket.emit('welcome', { message: 'Welcome to housie@home' });
		socket.on('joinGame', function (game) {
			console.log(game);
			//TODO: validation
			socket.player = game.playerName;
			socket.tag = game.tag;
			socket.join(game.tag);
		});
		socket.on('runGame', function (game) {
			console.log(game);
			//TODO: validation
			socket.player = 'Admin';
			socket.tag = game.tag;
			socket.join(game.tag);
		});
		socket.on('chatMessage', function (message) {
			console.log(message);
			//TODO: validation
			socket.broadcast.to(socket.tag).emit('chatMessage', {'sender':socket.player, 'message':message});
		});
	});
};

socketServer.prototype.clearRoom = function(tag) {
	var sockets = socketio.sockets.clients(tag);
	for (var i = 0; i < sockets.length; i++) {
		sockets[i].leave(tag);
	}
};

socketServer.prototype.broadcast = function(tag, eventName, message) {
	socketio.sockets.in(tag).emit(eventName, message);
};

module.exports = function (io) {
	return new socketServer(io);
};