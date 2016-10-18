var request = require('request');

exports.getMessageResponse = function(messageText, callback) {
	console.log("Hello!");
	messageText = cleanMessage(messageText);
	switch (messageText) {
        case "hello":
        case "hey":
        case "hi":
        case "ssup":
            sendText("Hello there!", callback);
            break;
		case "events":
		case "events around me":
		case "events near me":
		case "show me events around me":
		case "show me events near me":
		case "things to do":
		case "things to do around me":
		case "event suggestions":
		case "whats happening around me":
            askLocation(callback);
			break;
        case "mumbai":
        case "events in mumbai":
        case "events around mumbai":
            sendText("Sure! Let me fetch some events from Mumbai...", callback);
            sendNearbyEvents("mumbai", callback);
            break;
        case "bangalore":
        case "events in bangalore":
        case "events around bangalore":
            sendText("Awesome! Let me fetch some events from Bengaluru...", callback);
            sendNearbyEvents("bangalore", callback);
            break;
        case "chennai":
        case "events in chennai":
        case "events around chennai":
            sendText("Fabulous! Let me fetch some events from Chennai...", callback);
            sendNearbyEvents("chennai", callback);
            break;
        case "delhi":
        case "new delhi":
        case "events in delhi":
        case "events around delhi":
        case "events in new delhi":
        case "events around new delhi":
            sendText("Yes boss! Let me fetch some events from the capital...", callback);
            sendNearbyEvents("new+delhi", callback);
            break;
        default:
			sendText("Sorry I didn't understand you. Why don't you try 'events around me'.", callback);
	}
}

function cleanMessage(messageText) {
	messageText = messageText.toLowerCase();
	messageText = messageText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
    if (messageText.indexOf("event") != -1) {
        messageText = messageText.substring(messageText.indexOf("event"));
        messageText = messageText.replace(/ happening/i, '');
    }
	return messageText;
}

function askLocation(callback) {
    callback({
        type: "TEXT_OPTIONS",
        payload: {
            text: "Which city are you in?",
            options: [
            {
                title: "Mumbai",
                id: "CITY_LOCATION_MUMBAI"
            },
            {
                title: "New Delhi",
                id: "CITY_LOCATION_NEW_DELHI"
            },

            {
                title: "Chennai",
                id: "CITY_LOCATION_CHENNAI"
            },
            {
                title: "Bangalore",
                id: "CITY_LOCATION_BANGALORE"
            }]
        }
    });
}

function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
            dd='0'+dd
    } 

    if(mm<10) {
            mm='0'+mm
    } 

    return yyyy+'-'+mm+'-'+dd;
}

function sendNearbyEvents(city, callback) {
	request('https://api.eventshigh.com/api/date/'+city+'/'+getDate(), function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	res = JSON.parse(body);
		if (!res) {
			console.log("Got empty response from EH API");
			return textMessage("Something went wrong, sorry!");
		}
	  	console.log("Upcoming events: " + res["upcoming_events"].length);
        var valid_events = [];
        for (var i=0; i<res['upcoming_events'].length; i++){
            var e = res['upcoming_events'][i];
            if (e && e.title && e.source_url) {
                valid_events.push(e);
            }
        }
		valid_events.splice(10);
	  	callback({
	  		type: "EVENTS_LIST",
	  		payload: valid_events
	  	});
	  }
	});
}

function sendText(text, callback) {
	callback({
		type: "TEXT",
		payload: text
	});
}
