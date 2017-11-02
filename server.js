"use strict";

const express = require("express");
const sentiment = require("sentiment");
const twitter = require('ntwitter');
const log = require('pretty-log');
const app = express();


const t = new twitter({
    consumer_key: 'xxxxxx',
    consumer_secret: 'xxxxxx',
    access_token_key: 'xxxxxx',
    access_token_secret: 'xxxxxxx'
});


let tweetCount = 0;
let tweetTotalSentiment = 0;
let monitoringPhrase="";
 
function resetMonitoring() {
    monitoringPhrase = "";
}
 
function beginMonitoring(phrase) {

    let stream;
    monitoringPhrase = phrase;
    tweetCount = 0;
    tweetTotalSentiment = 0;
    t.verifyCredentials((error, data)=> {
        if (error) {
            return "Error connecting to Twitter: " + error;
        } else {
            stream = t.stream('statuses/filter', {
                'track': monitoringPhrase
            },  (stream)=>{
                
				log.debug("Monitoring Twitter for " + monitoringPhrase);
                
				stream.on('data', (data)=> {
                    // only evaluate the sentiment of English-language tweets
                    if (data.lang === 'en') {
                        sentiment(data.text, (err, result)=> {
                            tweetCount++;
                            tweetTotalSentiment += result.score;
                            log.debug("Tweet #" + tweetCount + ":  " + data.text);
                        });
                    }
                });
            });
            return stream;
        }
    });
}
 
function sentimentText() {
    let avg = tweetTotalSentiment / tweetCount;
    if (avg > 0.5) { // happy
        return ":-)";
    }
    if (avg < -0.5) { // angry
        return ":-(";
    }
    // neutral
    return ":-|";
}
 
 
app.get('/',(req, res)=> {
	
		resetMonitoring();
		
        const response = "<head>" +
            "<title>Twitter Sentiment Analysis</title>\n" +
            "</head>\n" +
            "<body>\n" +
            "<P>\n" +
            "Welcome to the Twitter Sentiment Analysis app.<br>\n" + 
            "What would you like to monitor?\n" +
            "</P>\n" +
            "<form action=\"/monitor\" method=\"get\">\n" +
            "<P>\n" +
            "<input type=\"text\" value=\"trump\" name=\"phrase\"><br><br>\n" +
            "<input type=\"submit\" value=\"Go\">\n" +
            "</P>\n" + "</form>\n" + "</body>";
            
            res.send(response);
    });        
app.get('/monitor',(req, res)=> {
       if (!monitoringPhrase) {
			const phrase = req.param('phrase');
			beginMonitoring(phrase);
       }
            const response = "<head>" +
                "<meta http-equiv=\"refresh\" content=\"5\">\n" +
                "<title>Twitter Sentiment Analysis</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "<P>\n" +
                "The Twittersphere is feeling<br>\n" +
                sentimentText() +"<br>\n" +
                "about " + monitoringPhrase + ".<br><br>" +
                "Analyzed " + tweetCount + " tweets...<br>" +
                "</P>\n" +
                "<A href=\"/\">Monitor another phrase</A>\n" +
                "</body>";
				
            res.send(response);
        
    });

const server = app.listen(process.env.PORT || 8080,  ()=> {
  const port = server.address().port;
  console.log("App now running on port", port);
});