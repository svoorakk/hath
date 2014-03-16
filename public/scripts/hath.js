//global variables

//Cookies
var getGames = function (type) {
	var cookieName = type+"Games";
	var games = $.cookie(cookieName);
	if (games)
		games = JSON.parse(games);
	else
		games = {};
	return games;
};

var setGames = function (games, type) {
	var cookieName = type+"Games";
	$.cookie(cookieName, JSON.stringify(games));
};

var addGame = function (game, type) {
	//get current games
	var games = getGames(type);
	games[game.tag] = game;
	setGames(games, type);
};

var removeGame = function (game, type) {
	//get current games
	var games = getGames(type);
	delete games[game.tag];
	setGames(games, type);
};

//actions
var initPage = function(accessType) {
	if (!$.cookie("currentScreen")) 
		$.cookie("currentScreen","home");
	if (!accessType) {
		accessType = $.cookie("currentScreen");
	}
	$("#home").hide();
	$("#run").hide();
	$("#play").hide();
	$("#"+$.cookie("currentScreen")).show();
	if (accessType == "run") {
		setupRunPanel();
	}
	if (accessType == "play") {
		setupPlayPanel();
	}
	//resetRunPanel();
};

var runBtnClick = function () {
	var accessType = "run";
	$.cookie("currentScreen",accessType);
	initPage(accessType);
};

var playBtnClick = function () {
	var accessType = "play";
	$.cookie("currentScreen",accessType);
	initPage(accessType);
};

var createGame = function() {
	//validate
	var tag = document.getElementById("newTag").value;
	var adPwd = document.getElementById("newAdminPwd").value;
	var gamePwd = document.getElementById("newGamePwd").value;
	if (tag.length === 0) {
		toDialog("Create Game Error!", "Game tag is required");
		return;
	}
	if (gamePwd.length === 0) {
		toDialog("Create Game Error!", "A player password is needed to create a game");
		return;
	}
	if (adPwd.length === 0) {
		toDialog("Create Game Error!", "An administrator password is needed to create a game.");
		return;
	}
	//call server api to create game
	var url = "/creategame/"+tag;
	var body = {};
	body.adminpwd = adPwd;
	body.playerpwd = gamePwd;
	showWaitDialog();
	//display wait animation
	xmlHttpPost(url, JSON.stringify(body), function(err, game) {
		hideWaitDialog();
		game = JSON.parse(game);
		if (err || game.error) {
			toDialog("Create Game Error!", (err ? JSON.stringify(err) : game.error));
			return;
		}
		game.adminPwd = adPwd;
		game.gamePwd = gamePwd;
		//create browser variable
		addGame(game, 'run');
		setupRunTabs(game);
		updateStatus('run', game);
	});
};

var drawNumber = function() {
	$("#callDisplay").html("&nbsp;");
	$("#btnDrawNbr").prop("disabled",true);
	var timer = numberAnimate(document.getElementById('numberDisplay'));
	var tag = $.cookie("currentGame");
	var localgame = getGames('run')[tag];
	var url = "drawnumber/"+tag;
	var body = {};
	body.adminpwd = localgame.adminPwd;
	xmlHttpPost(url, JSON.stringify(body), function(err, game) {
		game = JSON.parse(game);
		if (err || game.error) {
			toDialog("Draw Number Error!", (err ? JSON.stringify(err) : game.error));
			return;
		}
		localgame.drawnNumbers = game.drawnNumbers;
		localgame.pendingNumbers = game.pendingNumbers;
		localgame.finished = game.finished;
		localgame.gameStarted = game.gameStarted;
		addGame(localgame, 'run');
		var dur = Math.ceil(Math.random()*3000)+2000; //min 2 secs
		setTimeout(function () {
			clearInterval(timer);
			$("#numberDisplay").html(game.number);
			$("#callDisplay").html(game.numberCall);
			$("#btnDrawNbr").prop("disabled",false);
			if (game.finished)
				toDialog("Game update", "Game completed. All numbers are drawn");			
		}, dur);
	});	
};

var refreshGame = function (tag) {
	var type = $.cookie("currentScreen");
	if (type == "home") {
		return;
	}
	var localgame = getGames(type)[tag];
	var url = "getgame/"+tag;
	var body = {};
	body.gamepwd = localgame.gamePwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, response) {
		hideWaitDialog();
		response = JSON.parse(response);
		var game = response.game;
		if (err || game.error) {
			toDialog("Get Game Error!", (err ? JSON.stringify(err) : game.error));
			return;
		}
		localgame.drawnNumbers = game.drawnNumbers;
		localgame.pendingNumbers = game.pendingNumbers;
		localgame.finished = game.finished;
		localgame.gameStarted = game.gameStarted;
		addGame(localgame, type);
		updateStatus(type, localgame);
	});	
};


var setupRunTabs = function(game) {
	$.cookie("currentGame", game.tag);
	//display next screen
	$("#runAccordion").hide();
	$("#runTabs").show();
	//update status panel
};

var setupPlayTabs = function(game) {
	$.cookie("currentGame", game.tag);
	//display next screen
	$("#playAccordion").hide();
	$("#playTabs").show();
	//update status panel
};

var continueRunGame = function(tag) {
	var game = getGames('run')[tag];
	setupRunTabs(game);
};

var resetRunPanel = function() {
	$("#new").show();
	$("#current").show();
	$("#runTabs").hide();
};

//server calls
var xmlHttpPost = function (strURL, body, callback) {
	var self = this;
	// Mozilla/Safari
	if (window.XMLHttpRequest) {
		self.xmlHttpReq = new XMLHttpRequest();
	}
	// IE
	else if (window.ActiveXObject) {
		self.xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
	}
	self.xmlHttpReq.open('POST', strURL, true);
	self.xmlHttpReq.setRequestHeader('Content-Type', 'application/json');
	//add a callback 
	self.xmlHttpReq.onreadystatechange = function() {
		if (self.xmlHttpReq.readyState == 4) {  //if request is completed, go to callback function
			if (self.xmlHttpReq.status == 200)
				callback(null, self.xmlHttpReq.responseText);
			else {
				var err = {'errorText':self.xmlHttpReq.statusText, 
						'errorDetail': self.xmlHttpReq.responseText,
						'errorCode' : self.xmlHttpReq.status};
				callback(err);
			}
		}
	};
	//send the data
	self.xmlHttpReq.send(body);
};

//screen setup
var setupRunPanel = function() {
	var accessType = 'run';
	//from cookies, get any currently pending game(s)
	var games = getGames(accessType);
	//display them in a list
	populateGameList(document.getElementById("runGameList"), games, accessType);
	//display the new game panel
};

var setupPlayPanel = function() {
	var accessType = 'play';
	//from cookies, get any currently pending game(s)
	var games = getGames(accessType);
	//display them in a list
	populateGameList(document.getElementById("playGameList"), games, accessType);
	//display the new game panel
};

var activateTab =  function (type, index) {
	if (type === 'play') {
		if (index === 0 || index === 1) {
			getTickets();
		}
		if (index === 2) {
			refreshGame($.cookie("currentGame"));
		}
	}
	if (type === 'run') {
		if (index === 2) {
			refreshGame($.cookie("currentGame"));
		}
		if (index === 3) {
			updateStats();
		}
		if (index === 4) {
			updateLog();
		}
	}
};

var populateGameList = function(target, games, accessType) {
	var tags = Object.keys(games);
	if (!Array.isArray(tags)) {
		tags = [tags];
	}
	var url = "checkgamelist";
	var body = {};
	body.list = tags;
	//display wait animation
	xmlHttpPost(url, JSON.stringify(body), function(err, list) {
		list = JSON.parse(list);
		if (err || list.error) {
			toDialog("Check Game List Error!", (err ? JSON.stringify(err) : list.error));
			return;
		}
		listObj = {};
		for (var i = 0; i < list.length; i++) {
			listObj[list[i]] = list[i];
		}
		for (var j = tags.length-1; j > -1; j--) {
			if (!listObj[tags[j]]) {
				removeGame(tags[j], accessType);
				tags.splice(j, 1);
			}
		}		
		target.innerHTML = '';
		var o=document.createElement("option");
		o.value='';
		if (tags.length > 0) {
			o.text = '--Please select a game--';
		}
		else
			o.text = '--None available--';
		target.add(o, null);
		for (var k = 0; k < tags.length; k++) {
			o = document.createElement("option");
			o.text=games[tags[k]].tag;
			o.value=o.text;
			target.add(o, null);
		}		
	});
};

var socket; 

var joinGame = function(New) {
	var tag; 
	var name;
	var gamePwd;
	var playerPwd;
	if (New) {
		tag = document.getElementById("joinTag").value;
		name = document.getElementById("joinName").value;
		gamePwd = document.getElementById("joinGamePwd").value;
		playerPwd = document.getElementById("joinPlayerPwd").value;
	}
	else {
		tag = document.getElementById("playGameList").value;
		var game = getGames('play')[tag];
		name = game.playerName;
		gamePwd = game.gamePwd;
		playerPwd = game.playerPwd;
	}
	if (tag.length === 0) {
		toDialog("Error", "Game tag is required");
		return;
	}
	if (name.length === 0) {
		toDialog("Error", "Player name is required");
		return;
	}
	
	var url = "validatejoin/"+tag;
	var body = {};
	body.playername = name;
	body.gamepwd = gamePwd;	
	body.playerpwd = playerPwd;	
	//display wait animation
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, game) {
		hideWaitDialog();
		game = JSON.parse(game);
		if (err || game.error) {
			toDialog("Join Game Error!", (err ? JSON.stringify(err) : game.error));
			return;
		}
		//create browser variable
		game.gamePwd = gamePwd;
		game.playerName = name;
		game.playerPwd = playerPwd;	
		addGame(game, 'play');
		setupPlayTabs(game);
		activateTab('play', 0);
		socket = io.connect();
		socket.on('numberDrawn', function (game) {
			setTimeout(function () {
				updateTickets(game.number);
			}, 5000);
		});	
		socket.emit('joinGame', { 'tag': tag, 'gamePwd': gamePwd, playerName: name, playPwd: playerPwd });
	});
};

var newTicket = function () {
	var tag = $.cookie("currentGame");
	var game = getGames('play')[tag];
	var url = "issueticket/"+tag;
	var body = {};
	body.name = game.playerName;
	body.playerpwd = game.playerPwd;
	body.gamepwd = game.gamePwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, tickets) {
		hideWaitDialog();
		tickets = JSON.parse(tickets);
		if (err || tickets.error) {
			toDialog("Game Update Error!", (err ? JSON.stringify(err) : tickets.error));
			return;
		}
		$("#newticket").show();
		$("#newTicketDisplay").append(ticketToHtml (tickets[tickets.length-1]));
		$("#btnGetTicket").hide();
	});
};

var confirmTicket = function () {
	var tag = $.cookie("currentGame");
	var game = getGames('play')[tag];
	var url = "confirmticket/"+tag;
	var body = {};
	body.name = game.playerName;
	body.playerpwd = game.playerPwd;
	body.gamepwd = game.gamePwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, data) {
		hideWaitDialog();
		data = JSON.parse(data);
		if (err || data.error) {
			toDialog("Confirm Ticket Error!", (err ? JSON.stringify(err) : data.error));
			return;
		}
		if (data.message) {
			toDialog("Confirm Ticket", data.message);
		}
		$("#ticketCount").html("Tickets you already have for this game : " + data.ticketCount);
		$("#btnGetTicket").show();
		$("#newTicketDisplay").html("");
		$("#newticket").hide();
	});
};

var discardTicket = function () {
	var tag = $.cookie("currentGame");
	var game = getGames('play')[tag];
	var url = "discardticket/"+tag;
	var body = {};
	body.name = game.playerName;
	body.playerpwd = game.playerPwd;
	body.gamepwd = game.gamePwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, data) {
		hideWaitDialog();
		if (err || data.error) {
			toDialog("Discard ticket Error!", (err ? JSON.stringify(err) : data.error));
			return;
		}
		if (data.message) {
			toDialog("Discard Ticket", data.message);
		}
		$("#btnGetTicket").show();
		$("#newTicketDisplay").html("");
		$("#newticket").hide();
	});
};

var getTickets = function () {
	var tag = $.cookie("currentGame");
	refreshGame(tag);
	var game = getGames('play')[tag];
	var url = "gettickets/"+tag;
	var body = {};
	body.name = game.playerName;
	body.playerpwd = game.playerPwd;
	body.gamepwd = game.gamePwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, tickets) {
		hideWaitDialog();
		tickets = JSON.parse(tickets);
		if (err || tickets.error) {
			toDialog("Get Tickets Error!", (err ? JSON.stringify(err) : tickets.error));
			return;
		}
		var ticketHtml = "Number of tickets : " + tickets.length + "<br><br>";
		$("#ticketCount").html("Tickets you already have for this game : " + tickets.length);
		$("#btnGetTicket").show();
		$("#newTicketDisplay").html("");
		$("#newticket").hide();
		game = getGames('play')[tag];
		var drawn = {};
		game.drawnNumbers.forEach(function (elem, idx, arr) {
			if (elem) {
				drawn[elem] = elem;
			}
		});
		for (var i = 0; i < tickets.length; i++) {
			ticketHtml = ticketHtml + ticketToHtml(tickets[i], drawn) + "<br>";
		}
		$("#ticketsDisplay").html(ticketHtml);
	});
};

var updateStatus = function (type, game) {
	if (!game) {
		var tag = $.cookie("currentGame");
		game = getGames(type)[tag];
	}
	var max = 0;
	var pending = {};
	var drawn = {};
	game.pendingNumbers.forEach(function (elem, idx, arr) {
		if (elem) {
			pending[elem] = elem;
			if (elem > max)
				max = elem;
		}
	});
	game.drawnNumbers.forEach(function (elem, idx, arr) {
		if (elem) {
			drawn[elem] = elem;
			if (elem > max)
				max = elem;
		}
	});
	var statusList = document.getElementById(type+"Statuslist");
	statusList.innerHTML = '';
	for (var i = 1; i < max+1; i++) {
		var li = document.createElement('li');
		li.id = "statusCell_"+i;
		li.innerHTML = i;
		if (drawn[i]) {
			li.style["background-color"] = "rgb(166,240,166)";
		}
		else {
			li.style["background-color"] = "rgb(240,166,166)";
		}
		li.class = "ui-state-default";
		statusList.appendChild(li);
	}
};

var updateStats = function () {
	var tag = $.cookie("currentGame");
	game = getGames('run')[tag];
	var url = "gamestats/"+tag;
	var body = {};
	body.adminpwd = game.adminPwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, stats) {
		hideWaitDialog();
		if (err || stats.error) {
			toDialog("Game Stats Error!", (err ? JSON.stringify(err) : stats.error));
			return;
		}
		stats = JSON.parse(stats);
		var statsHtml = "<table><tr class='ui-state-default'><td>Numbers Drawn:</td><td>"+stats.numbersDrawnCount
			+"</td></tr>" + "<tr class='ui-state-default'><td>Numbers Pending:</td><td>" 
			+ stats.numbersPendingCount+"</td></tr></table>" 
			+ "Players : <table><tr><td></td><td>Name</td><td>Number of Tickets</td></tr>";
		var ticketCount = 0;
		if (!stats.players)
			stats.players = [];
		for (var i = 0; i < stats.players.length; i++) {
			statsHtml = statsHtml + "<tr class='ui-widget-content'><td>"+ (i+1)  + "</td><td>" + stats.players[i].name 
				+ "</td><td>" + stats.players[i].ticketCount + "</td></tr>";
			ticketCount = ticketCount + stats.players[i].ticketCount;
		}
		statsHtml = statsHtml + "<tr class='ui-state-default'><td></td><td>" + stats.players.length + " Players</td><td>" + ticketCount + "</td></tr>";  
		statsHtml = statsHtml + "<tr class='ui-state-default'><td></td><td>Printed Tickets:</td><td>" + stats.printTicketCount+"</td></tr></table>";
		$("#stats").html(statsHtml);
	});
};

var updateLog = function () {
	var tag = $.cookie("currentGame");
	game = getGames('run')[tag];
	var url = "log/"+tag;
	var body = {};
	body.adminpwd = game.adminPwd;
	showWaitDialog();
	xmlHttpPost(url, JSON.stringify(body), function(err, log) {
		hideWaitDialog();
		if (err || log.error) {
			toDialog("Get Log Error!", (err ? JSON.stringify(err) : log.error));
			return;
		}
		log = JSON.parse(log);
		var logHtml = "<table class='log'><tr class='ui-widget-content'><td class='log'>Date</td><td class='log'>Event</td><td class='log'>Data</td></tr>";
		for (var i = log.length-1; i > -1 ; i--) {
			logHtml = logHtml + "<tr><td>"+ log[i].eventDate  + "</td><td>" + log[i].eventType  
				+ "</td><td>" + log[i].eventData + "</td></tr>";
		}
		logHtml = logHtml + "</table>";
		$("#log").html(logHtml);
	});
};

var getTicketsForPrint = function () {
	var qty = document.getElementById("selTicketCount").value;
	if (qty === "")
		qty = "10";
	window.open("printtickets.html?qty="+qty);
};

var ticketToHtml = function (ticket, drawn) {
	var tabl = "";
	if (ticket) {
		tabl = "<TABLE class='ticket'>";
		for (var i = 0; i < ticket[0].length; i++) {
			tabl = tabl + "<TR>";
			for (var j = 0; j < ticket.length; j++) {
				var num = (ticket[j][i] ? ticket[j][i] : "");
				tabl = tabl + "<TD class='ticketcell' width='11%' align='center'><span id='ticketCell_" + num + "'";
				if (ticket[j][i] && drawn && drawn[ticket[j][i]])
					tabl = tabl + " style='text-decoration:line-through;color:crimson;background-color:lime'";
				tabl = tabl + "><span style='color:black;'>" + num + "</span></span></TD>";
			}
			tabl = tabl + "</TR>";
		}
		tabl = tabl + "</TABLE>";
	}
	return tabl;
};

var toDialog = function (titleText, messageText) {
	$("#dialog").html(messageText);
	$("#dialog").dialog({title: titleText, width: 'auto', modal: true});
};

var showFormHelp = function (controlName) {
	var control = document.getElementById(controlName);
	toDialog(control.placeholder, control.title);
};

var showWaitDialog = function() {
	hdrText = "Wait ...";
	msgText = "<img src='images/ajax-loader.gif'>";
	toDialog(hdrText, msgText);
};

var hideWaitDialog = function () {
	$( "#dialog" ).dialog( "close" );
};

var updateTickets = function(num) {
	var selector = "span[id=ticketCell_"+num+"]";
	$( selector ).effect( "shake", {}, 500, function () {
		$( selector ).css({'text-decoration':'line-through','color':'crimson', 'background-color':'lime'});
		$( selector ).effect( "shake", {}, 500, function () {});
	});
	$( "#statusCell_"+num ).css({'background-color':'lime'});
};

var numberAnimate = function (container) {
	var timer = setInterval(function () {
		var r = Math.ceil(Math.random()*200);
		var g = Math.ceil(Math.random()*200);
		var b = Math.ceil(Math.random()*200);
		container.setAttribute("style", "color:rgb("+r+","+g+","+b+")");
		container.innerText = Math.ceil(Math.random()*90);
	}, 10);
	return timer;
};

var displayTerms = function() {
	var message = "<iframe class='menu-iframe' src='toolbar/terms.html'></iframe>";
	toDialog("Website Terms", message);
};

var displayContact = function() {
	var message = "<iframe class='menu-iframe' src='toolbar/contact.html'></iframe>";
	toDialog("Contact details", message);
};

var displayHelp = function() {
	var message = "<iframe class='menu-iframe' src='toolbar/help.html'></iframe>";
	toDialog("Help", message);
};

var displayAbout = function() {
	var message = "<iframe class='menu-iframe' src='toolbar/about.html'></iframe>";
	toDialog("About", message);
};
