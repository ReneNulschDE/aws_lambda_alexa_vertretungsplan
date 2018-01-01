var https = require('https');
var fastXmlParser = require('fast-xml-parser');
var moment = require('moment');

moment.locale('de');

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        if (event.session.application.applicationId !== "amzn1.ask.skill.f715dce1-9fec-40dc-9d0b-e205f8474397") {
            context.fail("Invalid Application ID");
        }


        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function api(endpoint, cb) {

    return https.get({
        host: 'www.leibniz-gymnasium-leipzig.com',
        path: '/ver_mobil_sch/mobdaten/PlanKl' + endpoint + '.xml'
    }, function (res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {

            try {
                console.log("data received for " + endpoint);
                console.log("statusCode: ", res.statusCode); // <======= Here's the status code
                var parsed = null;
                if (res.statusCode == "200") {
                    var parsed = fastXmlParser.parse(body);
                }
                cb(parsed);
            } catch (err) {
                console.error('Unable to parse response as XML', err);
                throw (err);
            }
        });
    }).on('error', function (err) {
        // handle errors with the request itself
        console.error('Error with the request:', err.message);
        throw (err);
    });

}

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    this.cb = callback;

    switch (intentName) {
        case "getVertretungsplanByDate":

            var requestedDate = moment().format('YYYY-MM-DD');
            if (intent.slots.schooldate.value) {
                requestedDate = moment(intent.slots.schooldate.value).format('YYYYMMDD');
            }

            api(requestedDate, function (result) {

                var cardTitle = 'Vertretungsplan für ';
                var shouldEndSession = true;
                var speechOutput = 'Dein Vertretungsplan für den <say-as interpret-as="date">????' + moment(requestedDate).format('MMDD') + '</say-as> lautet: ';
                var textOutput = 'Dein Vertretungsplan für ' + moment(requestedDate).format('dddd, [den] Do MMMM YYYY ') + ' lautet: ';
                //                var speechOutput = 'Dein Vertretungsplan für 4. Januar lautet: ';

                if (result == null) {
                    speechOutput += "Für dieses Datum gibt es keinen Plan.";
                    textOutput += "Für dieses Datum gibt es keinen Plan.";
                    this.cb({}, buildSpeechletResponse(cardTitle, speechOutput, speechOutput, shouldEndSession, textOutput));
                } else {
                    var plan = [];
                    var classes = result["VpMobil"]["Klassen"]["Kl"]
                    for (i = 0; i < classes.length; i++) {
                        if (classes[i]["Kurz"] == "7b") {
                            plan = classes[i]["Pl"]["Std"]
                            break;
                        }
                    }

                    for (i = 0; i < plan.length; i++) {
                        if (isOdd(plan[i]["St"]) == 1) {
                            speechOutput += "Stunde " + plan[i]["St"] + " ist " + getSchoolSubject(plan[i]["Fa"]) + ". ";
                            textOutput += "Stunde " + plan[i]["St"] + " ist " + getSchoolSubject(plan[i]["Fa"]) + ". ";
                        }
                    }
                    this.cb({}, buildSpeechletResponse(cardTitle, speechOutput, speechOutput, shouldEndSession, textOutput));
                }

            }.bind(this));
            break;
        case "getVertretungsplanByClassAndDate":


            api('20180104', function (result) {

                var cardTitle = 'Vertretungsplan für ';
                var shouldEndSession = true;
                var speechOutput = 'Dein Vertretungsplan für <say-as interpret-as="date">????0104</say-as> lautet: ';

                var plan = [];
                var classes = result["VpMobil"]["Klassen"]["Kl"]
                for (i = 0; i < classes.length; i++) {
                    if (classes[i]["Kurz"] == "7b") {
                        plan = classes[i]["Pl"]["Std"]
                        break;
                    }
                }

                for (i = 0; i < plan.length; i++) {
                    if (isOdd(plan[i]["St"]) == 1) {
                        speechOutput += "Stunde " + plan[i]["St"] + " ist " + getSchoolSubject(plan[i]["Fa"]) + ". ";
                    }
                }

                this.cb({}, buildSpeechletResponse(cardTitle, speechOutput, speechOutput, shouldEndSession, speechOutput));

            }.bind(this));
            break;

        case "AMAZON.HelpIntent":
            getWelcomeResponse(callback);
            break;

        case "AMAZON.StopIntent":
        case "AMAZON.CancelIntent":
        default:
            handleSessionEndRequest(callback);
            break;
    }

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Willkommen";
    var speechOutput = "Du kannst mich nach den Schulplänen deiner Schule fragen.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Hier sind einige Beispiele: " +
        "Frag Vertretungsplan nach dem Plan für heute, " +
        "Frag Vertretungsplan nach dem Plan der Klasse 7b für heute, " +
        "Du kannst auch Stop sagen, um zu beenden " +
        "So, wie kann ich Dir helfen?";
    var shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession, speechOutput));
}

function handleSessionEndRequest(callback) {
    var cardTitle = ""; //"Session Ended";
    var speechOutput = ""; //"Thank you for trying the Alexa Skills Kit sample. Have a nice day!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession, null));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession, cardText) {
    return {
        outputSpeech: {
            //            type: "PlainText",
            //            text: output
            type: "SSML",
            ssml: "<speak>" + output + "</speak>"
        },
        card: {
            type: "Simple",
            title: title,
            content: cardText
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function isOdd(num) {
    return num % 2;
}

function getSchoolSubject(fa) {
    switch (fa) {
        case "MA":
            return "Mathe";
            break;
        case "GE":
            return "Geschichte";
            break;
        case "GEO":
            return "Geografie";
            break;
        case "PH":
            return "Physik";
            break;
        case "EN":
            return "Englisch";
            break;
        case "Ru7":
            return "Russisch";
            break;
        case "CH":
            return "Chemie";
            break;
        case "MU":
            return "Musik";
            break;
        case "BIO":
            return "Biologie";
            break;
        case "SPO":
            return "Sport";
            break;
        case "DE":
            return "Deutsch";
            break;
        case "INF7b-1", "INF7b-2":
            return "Informatik";
            break;
        case "ETH7c", "ETH7a", "ETH7b":
            return "Ethik";
            break;
        case "RE7", "RE8", "RE9", "RE10", "RE11", "RE12":
            return "Ethik";
            break;
        default:
            return fa;
            break;
    }
}