/**
 * New node file
 */
module.exports = {
		httpPort: 80,
		inactivityWait: 86400000,
		finishWait: 3600000,
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
		}
};