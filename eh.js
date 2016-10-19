var request = require('request');

var CATEGORY_CITY_DATE_REGEX = /^(?:(?:.*?\sme\s(.*?)\s)|(.*?)\s)?(?:event[s]?\s)?(?:(?:(?:happening\s)?(?:around|in|near)\s(.*?))?(?:\s(?:happening|for))?(?:\s(today|(?:this|on|next|coming)?\s?weekend|tomorrow)?)?)?$/i;

var CITY_DATE_REGEX = /^.*\s?(?:(?:event[s]?|thing[s]? to do|activities|activity|whats)(?:(?:\s(?:happening\s)?(?:around|in|near)\s(.*?))?(?:\s(?:happening|for))?(?:\s(today|(?:this|on|next|coming)?\s?weekend|tomorrow)?)?)?)$/i;

exports.getMessageResponse = function(senderID, messageText, callback) {
	response = parseMessage(messageText);
    console.log("Parsed::", response);
    if (response) {   
        if (!response.city || response.city == 'me') {
            console.log(global.SENDER_CITY_CACHE[senderID]);
            if (global.SENDER_CITY_CACHE[senderID]) {
                response.city = global.SENDER_CITY_CACHE[senderID];
            } else {
                askLocation(callback, response.date, response.category);
                return;
            }
        } 
        global.SENDER_CITY_CACHE[senderID] = response.city;
        handleCityDateCategory(callback, response.city, response.date, response.category);
        return;
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
    var matched = messageText.match(CATEGORY_CITY_DATE_REGEX);
    if (matched) {
        var category = matched[1] || matched[2];
        if (category.indexOf("event") != -1 || category.indexOf("activit") != -1 || category.indexOf("things to do") != -1) {
            category = null;
        }
        return {
            category: category,
            city: matched[3],
            date: matched[4]
        }
    }

    matched = messageText.match(CITY_DATE_REGEX);
    if (matched) {
        return {
            category: null,
            city: matched[1],
            date: matched[2]
        }
    }
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

function handleCityDateCategory(callback, city, date, category) {
    if (date && date.indexOf("weekend") != -1) {
        date = "this+weekend";
    } 
    if (!date) {
        date = "today";
    }

    if (!category) {
        category = "";
    } else {
        category += " ";
    }

    switch(city) {
        case "mumbai":
            sendText("Sure! Let me fetch some " + category + "events from Mumbai for " + date + "...", callback);
            sendNearbyEvents("mumbai", date, category, callback);
            break;
        case "bangalore":
            sendText("Awesome! Let me fetch some " + category + "events  from Bengaluru for " + date + "...", callback);
            sendNearbyEvents("bangalore", date, category, callback);
            break;
        case "chennai":
            sendText("Fabulous! Let me fetch some " + category + "events from Chennai for " + date + "...", callback);
            sendNearbyEvents("chennai", date, category, callback);
            break;
        case "delhi":
        case "new delhi":
            sendText("Yes boss! Let me fetch some " + category + "events  from the capital for " + date  + "...", callback);
            sendNearbyEvents("new+delhi", date, category, callback);
            break;
    }
}

function sendNearbyEvents(city, date, category, callback) {
    if (['today', 'tomorrow', 'this+weekend'].indexOf(date) == -1) {
        date = getDate()
    }
    console.log("Getting events for city: " + city + " and date: " + date + " and category:" + category);
    if (category) {
        final_url = 'https://api.eventshigh.com/api/events_for_interest_by_date/'+city+'/'+category+'/'+date;
    } else {
        final_url = 'https://api.eventshigh.com/api/date/'+city+'/'+date;   
    }
	request(final_url, function (error, response, body) {
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
