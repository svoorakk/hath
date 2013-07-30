
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/drawnumber/:tag', routes.drawNumber);
app.get('/creategame/:tag', routes.createGame);
app.get('/issueticket/:tag', routes.issueTicket);
app.get('/confirmticket/:tag', routes.confirmTicket);
app.get('/gettickets/:tag', routes.getTickets);
app.get('/discardticket/:tag', routes.discardTicket);
app.get('/getticketsforprint', routes.getTicketsForPrint);
app.get('/getticketsforprint/:tag', routes.getTicketsForPrint);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
