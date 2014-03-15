/**
 * New node file
 */
"option strict";

var config = require('./configuration');
var email = require('emailjs');

var emailServer = email.server.connect({
	user:     config.email.user, 
	password: config.email.password, 
	host:     config.email.smtpServer, 
	ssl:      config.email.ssl
});

var notify = function () {};

//function to send an email
notify.prototype.sendEmail = function (subject, body) {
	var message = {
			text: body,
			from: config.email.from,
			to: config.email.to,
			subject: subject,
			attachment:
				   [
				      {data:body, alternative:true}
				   ]
	};
	if (config.email.sendEmail)
		emailServer.send(message, function(err, message) { console.log(err || message); })
	else
		console.log(message);
}

module.exports = function () {
	return new notify();
};
