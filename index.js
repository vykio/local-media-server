const express = require("express");
const app = express();
const fs = require('fs');
var glob = require("glob");
var chokidar = require('chokidar');
var path = require('path');

var watcher = chokidar.watch('./library/', {ignored: /^\./, persistent: true});

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/local-media-server', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'CONNECTION ERROR'));
db.once('open', function() {
  //we're connected
  console.log('Database\t> Connected to MongoDB');
});
db.dropDatabase();

var {Video} = require('./models/video');
const { nanoid } = require("nanoid");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/*const options ={};
glob("library/*", options, function (er, files) {
    files.forEach(element => {
        console.log(element);
    });
  })*/

watcher
  .on('unlink', function(path) {
    console.log('File', path, 'has been removed');
    
  })
  .on('add', function(path) {
      console.log('File', path, 'has been added');
      Video.insertMany({
        id: nanoid(5),
        path: path,
        created: new Date()
    });
    })
  .on('change', function(path) {
      console.log('File', path, 'has been changed');
    })
  
  .on('error', function(error) {
      console.error('Error happened', error);
    })


app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.listen(8000, function () {
  console.log("Server\t\t> Listening on port 8000!");
});

function getPathFromId(id) {
    
    return Video.findOne({id: id}, function(err, video) {
        if (err) throw err;
        return video;
    });

    
}

app.get("/:id", function (req, res) {
    console.log(req.params.id);
    getPathFromId(req.params.id).then(function(video) {
        console.log(video.path);
    });
    res.render('index', {title: 'Video', message: 'lpb', source:req.params.id});
});

app.get("/video/:id", function (req, res) {





    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }
  
    // get video stats (about 61MB)
    const videoPath = path.join(__dirname, 'library/bigbuck.mp4')
    const videoSize = fs.statSync(videoPath).size;
  
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  
    // Create headers
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
  
    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
  
    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });
  
    // Stream the video chunk to the client
    videoStream.pipe(res);
  });
  