const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});


function timeStamp() {
  let now = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
  now = new Date(now)
  let date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  let time = [ now.getHours(), now.getMinutes() ];
  let suffix = ( time[0] < 12 ) ? "AM" : "PM";
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
  time[0] = time[0] || 12;

  for ( let i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }
  return date.join("/") + " " + time.join(":") + " " + suffix;
}

exports.handler = (event, context) => {

  try {

    if (event.session.new) {
      // New Session
    }

    switch (event.request.type) {

    case "LaunchRequest":
      // Launch Request
      context.succeed(
        generateResponse(
          buildSpeechletResponse("Welcome, you may set, check, or remove your last verify", false),
          {}
        )
      )
      break;

    case "IntentRequest":
      // Intent Request
      switch(event.request.intent.name) {

      case "CheckVerify":
        var params = {
          TableName: 'Test1',
          Key: {
            userId: event.session.user.userId
          }
        };
        docClient.get(params, function(err, data) {
           if (data.Item) {
            context.succeed(
              generateResponse(
                buildSpeechletResponse("You last verified on " + data.Item.date, true),
                {}
              )
            )
           } else {
            context.succeed(
              generateResponse(
                buildSpeechletResponse("Cannot check. You must first verify.", true),
                {}
              )
            )
          }
        })

      break;

      case "SetVerify":
      var params = {
        Item: {
          userId: event.session.user.userId,
          date: timeStamp()
        },
        TableName: 'Test1'
      };
      docClient.put(params, () => {
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Your verify has been set", true),
            {}
          )
        )
      })

      break;

      case "RemoveVerify":
      var params = {
        TableName: 'Test1',
        Key: {
          userId: event.session.user.userId
        }
      };
      docClient.delete(params, function(err, data) {
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Remove request complete.", true),
            {}
          )
        )
      });

      break;

      case "AMAZON.HelpIntent":
      context.succeed(
        generateResponse(
          buildSpeechletResponse("To set a verify, say, Set Verify. To check a verify, say, when was the last time I verified.", false),
          {}
        )
      )
      break;

      case "AMAZON.CancelIntent":
      context.succeed(
        generateResponse(
          buildSpeechletResponse("Goodbye", true),
          {}
        )
      )
      break;

      case "AMAZON.StopIntent":
      context.succeed(
        generateResponse(
          buildSpeechletResponse("Goodbye", true),
          {}
        )
      )
      break;

      default:
        throw "Invalid intent"
      }

      break;

      case "SessionEndedRequest":
        // Session Ended Request
      break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)

    }

  } catch(error) { context.fail(`Exception: ${error}`) }

}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {

  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

}
