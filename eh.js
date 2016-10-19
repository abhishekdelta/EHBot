var request = require('request');

var GENERAL_EVENTS_REGEX = /^(?:.*)\s?(?:(?:event[s]?|thing[s]? to do|activities|activity|whats)(?:(?:\s(?:happening\s)?(?:around|in|near)\s(.*?))?(?:\s(?:happening|for))?(?:\s(today|(?:this|on|next|coming)?\s?weekend|tomorrow)?)?)?)$/i;

exports.getMessageResponse = function(senderID, messageText, callback) {
	response = parseMessage(messageText);
    console.log("Parsed::", response);
    if (response) {
        if (response.type == 'CITY_DATE') {
            if (!response.city || response.city == 'me') {
                console.log(global.SENDER_CITY_CACHE[senderID]);
                if (global.SENDER_CITY_CACHE[senderID]) {
                    response.city = global.SENDER_CITY_CACHE[senderID];
                } else {
                    askLocation(callback, response.date, null);
                    return;
                }
            } 
            global.SENDER_CITY_CACHE[senderID] = response.city;
            handleCityDate(senderID, callback, response.city, response.date);
            return;
        } 
        // else if (response.type == 'CATEGORY_CITY_DATE') {
        //     if (response.city == 'me') {
        //         askLocation(callback, response.date, response.category);
        //         return;
        //     } 
        //     handleCategoryCityDate(callback, response.city, response.date, response.category);
        //     return;
        // }
    } 

	switch (messageText) {
        case "hello":
        case "hey":
        case "hi":
        case "ssup":
            sendText("Hello there!", callback);
            break;
        default:
            sendText("Sorry I didn't understand you. Why don't you try 'events around me this weekend'.", callback);
    }
}

function parseMessage(messageText) {
    messageText = messageText.toLowerCase();
    messageText = messageText.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
    var matched = messageText.match(GENERAL_EVENTS_REGEX);
    if (matched) {
        return {
            type: 'CITY_DATE',
            city: matched[1],
            date: matched[2]
        }
    }

    // matched = messageText.match(CATEGORY_EVENTS_REGEX);
    // if (matched) {
    //     return {
    //         type: 'CATEGORY_CITY_DATE',
    //         category: matched[1],
    //         city: matched[2],
    //         date: matched[3]
    //     }
    // }

    return {}
}

function askLocation(callback, date_str, category_str) {
    callback({
        type: "TEXT_OPTIONS",
        payload: {
            text: "Which city are you in?",
            options: [
            {
                title: "Mumbai",
                payload: {city: 'mumbai', date: date_str, category: category_str} 
            },
            {
                title: "New Delhi",
                payload: {city: 'new delhi', date: date_str, category: category_str} 
            },

            {
                title: "Chennai",
                payload: {city: 'chennai', date: date_str, category: category_str} 
            },
            {
                title: "Bangalore",
                payload: {city: 'bangalore', date: date_str, category: category_str} 
            }]
        }
    });
}

function handleCityDate(senderID, callback, city, date) {
    if (date && date.indexOf("weekend") != -1) {
        date = "this+weekend";
    } 
    if (!date) {
        date = "today";
    }

    switch(city) {
        case "mumbai":
            sendText("Sure! Let me fetch some events from Mumbai for " + date + "...", callback);
            sendNearbyEvents("mumbai", date, callback);
            break;
        case "bangalore":
            sendText("Awesome! Let me fetch some events from Bengaluru for " + date + "...", callback);
            sendNearbyEvents("bangalore", date, callback);
            break;
        case "chennai":
            sendText("Fabulous! Let me fetch some events from Chennai for " + date + "...", callback);
            sendNearbyEvents("chennai", date, callback);
            break;
        case "delhi":
        case "new delhi":
            sendText("Yes boss! Let me fetch some events from the capital for " + date  + "...", callback);
            sendNearbyEvents("new+delhi", date, callback);
            break;
        default:
            sendText("I think I didn't get your city, or may be we're not in your city yet...", callback);
            global.SENDER_CITY_CACHE[senderID] = null;
    }
}

function sendNearbyEvents(city, date, callback) {
    if (['today', 'tomorrow', 'this+weekend'].indexOf(date) == -1) {
        date = getDate()
    }
    console.log("Getting events for city: " + city + " and date: " + date);
	request('https://api.eventshigh.com/api/date/'+city+'/'+date, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	res = JSON.parse(body);
		if (!res) {
			console.log("Got empty response from EH API");
			sendText("Something went wrong, sorry!", callback);
		}
	  	console.log("Upcoming events: " + res["upcoming_events"].length);
        var valid_events = [];
        for (var i=0; i<res['upcoming_events'].length; i++){
            var e = res['upcoming_events'][i];
            if (e && e.title && e.id) {
                e.eh_url = "https://www.eventshigh.com/detail/" + city + "/" + e.id;
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

function sendText(text, callback) {
	callback({
		type: "TEXT",
		payload: text
	});
}
