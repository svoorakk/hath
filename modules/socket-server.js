var socketio;

exports.setup = function(io) {
	socketio = io;
	io.sockets.on('connection', function (socket) {
		socket.emit('welcome', { message: 'Welcome to housie@home' });
		socket.on('joingame', function (data) {
			console.log(data);
			//TODO: validation
			socket.join(data.tag);
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
