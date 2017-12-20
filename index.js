 /******************************************************
//Backed up as index.js
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var mongo=require('mongodb').MongoClient;
/*var googl = require('goo.gl');*/

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
      var query=col.find().sort({time:-1}).toArray(function (err, documents){
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
    var query=col.find().toArray(function (err, documents){
      if(err){console.log(err);}
      console.log(documents);
    })
    // do some work here with the database.

    //Close connection
    db.close();
  }
});
  
  res.send('Term is: '+req.params.term+';Offset is: '+req.query.offset+';Time is: '+ d.toLocaleString());
})
        
/*
app.get('/https://:origUrl', function(req, res) {
  console.log(req.params.origUrl);
  //let shortUrl='';
  //let urlObj={'url':req.params.origUrl, 'short-url':shortenUrl(req.params.origUrl)};
  googl.setKey('AIzaSyAxgUwTeQNjkpykpftRxW189BAcT3ZGdpw');
  var shortGoogUrl='';
  // Shorten a long url and output the result 
  googl.shorten(req.params.origUrl)
    .then(function (shortUrl) {
        console.log(shortUrl);
        res.type('txt').send(JSON.stringify({'url':req.params.origUrl, 'short-url':shortUrl}));
    })
    .catch(function (err) {
        console.error(err.message);
    });
  
})
*/

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