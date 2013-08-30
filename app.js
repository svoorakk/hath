
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
app.post('/creategame/:tag', routes.createGame);
app.post('/drawnumber/:tag', routes.drawNumber);
app.post('/issueticket/:tag', routes.issueTicket);
app.post('/confirmticket/:tag', routes.confirmTicket);
app.post('/gettickets/:tag', routes.getTickets);
app.post('/discardticket/:tag', routes.discardTicket);
app.post('/getticketsforprint', routes.getTicketsForPrint);
app.post('/getticketsforprint/:tag', routes.getTicketsForPrint);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
