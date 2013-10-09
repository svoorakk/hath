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
var initPage = function() {
	if (!$.cookie("currentScreen")) 
		$.cookie("currentScreen","home");
	$("#home").hide();
	$("#run").hide();
	$("#play").hide();
	$("#"+$.cookie("currentScreen")).show();
	setupRunPanel();
	setupPlayPanel();
	resetRunPanel();
};

var runBtnClick = function () {
	$.cookie("currentScreen","run");
	initPage();
};

var playBtnClick = function () {
	$.cookie("currentScreen","play");
	initPage();
};

var createGame = function() {
	//validate
	var tag = document.getElementById("newTag").value;
	var adPwd = document.getElementById("newAdminPwd").value;
	var playPwd = document.getElementById("newPlayPwd").value;
	//call server api to create game
	var url = "/creategame/"+tag;
	var body = {};
	body.adminpwd = adPwd;
	body.playerpwd = playPwd;
	//display wait animation
	xmlHttpPost(url, JSON.stringify(body), function(err, game) {
		game = JSON.parse(game);
		if (game.error) {
			alert(game.error);
			return;
		}
		game.adminPwd = adPwd;
		game.playPwd = playPwd;
		//create browser variable
		addGame(game, 'run');
		setupRunTabs(game);
	});
};

var setupRunTabs = function(game) {
	$.cookie("currentGame", game.tag);
	//display next screen
	$("#runNew").hide();
	$("#runCurrent").hide();
	$("#runTabs").show();
	//update status panel
};

var setupPlayTabs = function(game) {
	$.cookie("currentGame", game.tag);
	//display next screen
	$("#playNew").hide();
	$("#playCurrent").hide();
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
	//from cookies, get any currently pending game(s)
	var games = getGames('run');
	//display them in a list
	populateGameList(document.getElementById("runGameList"), games);
	//display the new game panel
};

var setupPlayPanel = function() {
	//from cookies, get any currently pending game(s)
	var games = getGames('play');
	//display them in a list
	populateGameList(document.getElementById("playGameList"), games);
	//display the new game panel
};

var populateGameList = function(target, games) {
	var tags = Object.keys(games);
	target.innerHTML = '';
	var o=document.createElement("option");
	o.value='';
	if (tags.length > 0) {
		o.text = '--Please select a game--';
	}
	else
		o.text = '--None available--';
	target.add(o, null);
	for (var i = 0; i < tags.length; i++) {
		o = document.createElement("option");
		o.text=games[tags[i]].tag;
		o.value=o.text;
		target.add(o, null);
	}
};

var joinGame = function(New) {
	if (New) {
		var tag = document.getElementById("joinTag").value;
		var name = document.getElementById("joinName").value;
		var gamePwd = document.getElementById("joinGamePwd").value;
		var playerPwd = document.getElementById("joinPlayerPwd").value;
	}
	else {
		var tag = document.getElementById("playGameList").value;
		var game = getGames('play')[tag];
		var name = game.playerName;
		var gamePwd = game.gamePwd;
		var playerPwd = game.playerPwd;
	}
	var url = "validatejoin/"+tag;
	var body = {};
	body.playername = name;
	body.gamepwd = gamePwd;	
	body.playerpwd = playerPwd;	
	//display wait animation
	xmlHttpPost(url, JSON.stringify(body), function(err, game) {
		game = JSON.parse(game);
		if (game.error) {
			alert(game.error);
			return;
		}
		//create browser variable
		game.gamePwd = gamePwd;
		game.playerName = name;
		game.playerPwd = playerPwd;	
		addGame(game, 'play');
		setupPlayTabs(game);
	});
}

var getTicket = function () {
	var tag = $.cookie("currentGame");
	var game = getGames('play')[tag];
	var url = "issueticket/"+tag;
	var body = {};
	body.name = game.playerName;
	body.playerpwd = game.playerPwd;
	body.gamepwd = game.gamePwd;
	xmlHttpPost(url, JSON.stringify(body), function(err, tickets) {
		tickets = JSON.parse(tickets);
		if (tickets.error) {
			alert(tickets.error);
			return;
		}
		$("#newticket").show();
		$("#newTicketDisplay").append(ticketToHtml (tickets[tickets.length-1]));
		$("#btnGetTicket").hide();
	});
};

var confirmTicket = function () {
	$("#btnGetTicket").show();
	$("#newticket").hide();
};

var discardTicket = function () {
	$("#btnGetTicket").show();
	$("#newticket").hide();
};


var ticketToHtml = function (ticket) {
	var tabl = "";
	if (ticket) {
		tabl = "<TABLE class='ticket'>";
		for (var i = 0; i < ticket[0].length; i++) {
			tabl = tabl + "<TR>";
			for (var j = 0; j < ticket.length; j++) {
				tabl = tabl + "<TD class='ticketcell'>" + (ticket[j][i] ? ticket[j][i] : "") + "</TD>";
			}
			tabl = tabl + "</TR>";
		}
		tabl = tabl + "</TABLE>";
	}
	return tabl;
}