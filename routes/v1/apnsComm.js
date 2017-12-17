var clc = require('cli-color');
var apn  = require('apn');
//Configure apn for APNS Integration

var apnOptions = {
	"dev": {
		cert: "./Certs/dev/cert.pem",
		key:  "./Certs/dev/key.pem",
		production: false	
		},
	"prod" : {
		cert: "./Certs/prod/cert.pem",
		key:  "./Certs/prod/key.pem",
		production: true	
	}
};

var apnConnectionDev = new apn.Connection(apnOptions.dev);
var apnConnectionProd = new apn.Connection(apnOptions.prod);

console.log(clc.cyan('[APNS] Initiated Communication with APNS.'));

var pushOptions = 
{
	"silent" : 	//Silent
	{
		"sound" : "",
		"content-available" : 1
	},
	"active" :
	{
		"sound" : "",
		"content-available" : 0
	}
};

/*			
	pushTokens: array,
	messegeDetails : JSON 
		{
			alert : {		//JSON OR String, leave as empty string "" for silent notification
				title: "A short string describing the purpose of the notification."
				body: "A text of the alert message"
			}, 
			payload : {
				//Custom Objects being passed to the client
			},
			badge: num >= 0 // if 0 will display no badge on the app icon
			mode : 'client' or 'agent'	//iPhone app vs iPad app
			category: "Notification Category as defined on native apps"
		} 
*/


var pushNotification = function(pushTokens, messageDetails, options, env)
{    
	console.log(clc.cyan('[APNS] Creating Notification to send out'));

	var note = new apn.Notification();
	
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = messageDetails.badge;
	note.alert = messageDetails.alert;
	note.payload = messageDetails.payload;
	note.category = messageDetails.category;

	note.sound = options.sound;
	note.contentAvailable = options['content-available'];

	pushTokens.forEach(function (token)
	{
		console.log ("pushing");
		var device = new apn.Device(token);
		console.log ("pushing client "+device);
		
		
		//if (env !== 'DEV') {
		// apnConnectionProd.pushNotification(note, device);
		//} else {
			// Dev
			apnConnectionDev.pushNotification(note, device);
		//	}
	});

	console.log(clc.cyan('[APNS] Pushed out all Tokens'));
};

module.exports.pushOptions = pushOptions;
module.exports.pushNotification = pushNotification;