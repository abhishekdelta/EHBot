var request = require('request');

exports.getMessageResponse = function(messageText) {
	console.log("Hello!");
	messageText = cleanMessage(messageText);
	switch (messageText) {
		case "events":
		case "events around me":
		case "events near me":
		case "show me events around me":
		case "show me events near me":
		case "things to do":
		case "things to do around me":
		case "event suggestions":
		case "whats happening around me":
			return getNearbyEvents();
			break;
		default:
			return textMessage("Sorry I didn't understand you. Why don't you try 'events around me'.");
	}
}

function cleanMessage(messageText) {
	messageText = messageText.toLowerCase();
	messageText = messageText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
	return messageText;
}

function getNearbyEvents() {
	request('https://api.eventshigh.com/api/events/bangalore/today', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	res = JSON.parse(body);
		if (!res) {
			console.log("Got empty response from EH API");
			return textMessage("Something went wrong, sorry!");
		}
	  	console.log("Upcoming events: " + res["upcoming_events"].length);
	  	upcoming_events = res['upcoming_events'].splice(10);
	  	return {
	  		type: "EVENTS_LIST",
	  		payload: upcoming_events
	  	};
	  }
	});
}

function textMessage(text) {
	return {
		type: "TEXT",
		payload: text
	}
}
