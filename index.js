 /******************************************************
//Backed up as index.js
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var mongo=require('mongodb').MongoClient;
var googleSearch=require('google-search');
//var googleImages = require('google-images');
//var gSearchAPIKey=process.env.GSEARCH_API;
//var cseID=process.env.CSE_ID;
var app = express();

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })

app.get('/test', function(req, res){
  res.end('Hello World!');
});

app.get('/history', function(req, res) {
  var mongoUrl = 'mongodb://localhost:27017/data';
  mongo.connect(mongoUrl, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', mongoUrl);
      var myDB=db.db('data');
      var col=myDB.collection('searches');
      var query=col.find().sort({time:-1}).limit(10).toArray(function (err, documents){
        if(err){console.log(err);}
        console.log(documents);
        res.send(documents);
      })
      db.close();
      //res.send(query);
    }
  })
})
  

app.get('/favicon.ico', function(req, res) {
  res.send('Ignore this!');
})
        

app.get('/:term', function(req, res) {
  console.log(req.params.term);
  console.log(req.query.offset);
  
  //if (!(req.query.offset===parseInt(req.query.offset))){
    //res.end('Please provide an integer as the offset!');
    //next();
  //} else {
    var google= new googleSearch({
      key: process.env.API_KEY,
      cx: process.env.CSE_ID
    });
    google.build({
      q: req.params.term,
      searchType:'image',
      //start: 1,
      //fileType: "image",
      //gl: "tr", //geolocation, 
      //lr: "lang_tr",
      num: Math.min(req.query.offset,10), // Number of search results to return between 1 and 10, inclusive 
      //siteSearch: "http://kitaplar.ankara.edu.tr/" // Restricts results to URLs from a specified site 
    }, function(error, response) {
      console.log(response);
      var responseBuffer=[];
      response.items.forEach(function(item){
        //console.log(item.snippet);
        let tempObj={};
        tempObj={
          title:item.title,
          snippet:item.snippet,
          link:item.link,
          //url:item.formattedUrl
        }
        responseBuffer.push(tempObj);
      });
      res.send(JSON.stringify(responseBuffer));
    });
    var d=new Date;
    var mongoUrl = 'mongodb://localhost:27017/data';
    mongo.connect(mongoUrl, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
        console.log('Connection established to', mongoUrl);
        var myDB=db.db('data');
        var col=myDB.collection('searches');
        col.insert({
          term:req.params.term,
          time: d.toLocaleString()
        }, function (err,data){
          if (err){console.log(err);}
          console.log(JSON.stringify(data));
        })
        /*
        var query=col.find().toArray(function (err, documents){
          if(err){console.log(err);}
          console.log(documents);
        })
        */
        //Close connection
        db.close();
      }
    });

    //res.send('Term is: '+req.params.term+';Offset is: '+req.query.offset+';Time is: '+ d.toLocaleString());
  //}
})
        

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});