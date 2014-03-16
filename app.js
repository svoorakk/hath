
/**
 * Module dependencies.
 */
"option strict";

var config = require('./modules/configuration');
var Notify = require('./modules/notify');
var notify = new Notify();

var express = require('express')
 , routes = require('./routes')
 , ss = require('./modules/socket-server');

var app = module.exports = express.createServer()
 ,  io = require('socket.io').listen(app);



// Configuration

app.configure(function(){
  app.use(express.logger());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

socketServer = new ss(io);

// Routes
routes.init(socketServer);

app.get('/', routes.index);
app.post('/creategame/:tag', routes.createGame);
app.post('/drawnumber/:tag', routes.drawNumber);
app.post('/validatejoin/:tag', routes.validateJoin);
app.post('/issueticket/:tag', routes.issueTicket);
app.post('/confirmticket/:tag', routes.confirmTicket);
app.post('/gettickets/:tag', routes.getTickets);
app.post('/discardticket/:tag', routes.discardTicket);
app.post('/getticketsforprint', routes.getTicketsForPrint);
app.post('/getticketsforprint/:tag', routes.getTicketsForPrint);
app.post('/getgame/:tag', routes.getGame);
app.post('/abandongame/:tag', routes.abandonGame);
app.post('/gamestats/:tag', routes.gameStats);
app.post('/gamelist/:filter', routes.gameList);
app.post('/newgamelist/:filter', routes.newGameList);
app.post('/checkgamelist', routes.checkGameList);
app.post('/log/:tag', routes.log);

app.listen(config.httpPort, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

process.on('uncaughtException', function (err) {
	console.log('Uncaught exception: ', err);
});

process.on('exit', function () {
	notify.sendEmail('housieathome break','Housie at home app process exited.');
});
