/**
 * New node file
 */
"option strict";

module.exports = {
		httpPort: 3000,
		inactivityWait: 86400000,
		finishWait: 3600000,
		monitoringInterval: 60000,
		eventTypes: {
			createGame: 'Create Game',
			continueGame: 'Continue Game',
			checkList: "Check List",
			confirmTicket: "Confirm Ticket",
			discardTicket: "Discard ticket",
			drawNumber: 'Draw Number',
			getGame: 'Get game',
			getList: 'Get list',
			getStats: 'Get stats',
			getTickets: 'Get tickets',
			issueTicket: 'Issue ticket',
			monitoring: "Monitoring",
			playerRejoin: 'Player re-join',
			playerJoin: 'Player join',
			ticketsPrint: 'Tickets Print'
		},
		email: {
			host: 'smtp.mail.yahoo.com',
			ssl: true,
			user: 'fromhousieathome',
			password: 'Vs190677',
			from: 'fromhousieathome@yahoo.com',
			to: 'housieathome@yahoo.co.uk',
			sendEmail: true
		}
};