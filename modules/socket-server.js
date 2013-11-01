var socketio;

exports.setup = function(io) {
	socketio = io;
	io.sockets.on('connection', function (socket) {
		socket.emit('welcome', { message: 'Welcome to housie@home' });
		socket.on('joingame', function (game) {
			console.log(game);
			//TODO: validation
			socket.player = game.playerName;
			socket.tag = game.tag;
			socket.join(game.tag);
		});
		socket.on('rungame', function (game) {
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

exports.clearRoom = function(tag) {
	var sockets = socketio.sockets.clients(tag);
	for (var i = 0; i < sockets.length; i++) {
		sockets[i].leave(tag);
	}
};

exports.broadcast = function(tag, eventName, message) {
	socketio.sockets.in(tag).emit(eventName, message);
};
