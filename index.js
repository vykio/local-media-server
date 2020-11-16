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
    Video.deleteOne({path: path}).exec();
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


app.get("/", async function (req, res) {
  const videos = await Video.find().sort({created:-1}).exec();
  console.log(videos);
  res.render('showvideos', {videos: videos});
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

app.get("/test", function (req,res){
  res.render('index', {title: 'Video', message: 'lpb', source:'/testmkv'});
});

app.get("/testmkv", function (req, res) {
    var file = path.resolve(__dirname,"library/bigbuck.mp4");
    fs.stat(file, function(err, stats) {
      if (err) {
        if (err.code === 'ENOENT') {
          // 404 Error if file not found
          return res.sendStatus(404);
        }
      res.end(err);
      }
      var range = req.headers.range;
      if (!range) {
       // 416 Wrong range
       return res.sendStatus(416);
      }
      var positions = range.replace(/bytes=/, "").split("-");
      var start = parseInt(positions[0], 10);
      var total = stats.size;
      var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      var chunksize = (end - start) + 1;

      res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
      });

      var stream = fs.createReadStream(file, { start: start, end: end })
        .on("open", function() {
          stream.pipe(res);
        }).on("error", function(err) {
          res.end(err);
        });
    });
});

app.get("/:id", function (req, res) {
    console.log(req.params.id);
    getPathFromId(req.params.id).then(function(video) {
      //const videoPath = path.join(__dirname, video.path)
      if (video == null) {
        res.redirect('/');
      } else {
        res.render('index', {title: 'Video', message: 'lpb', source:req.params.id});
      }
    });
    
});

app.get("/video/:id", function (req, res) {

    // Ensure there is a range given for the video
    /*const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }
  
    // get video stats (about 61MB)
    const videoPath = path.join(__dirname, 'library/bigbuck.mp4')
    const videoSize = fs.statSync('library/bigbuck.mp4').size;
  
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
    videoStream.pipe(res);*/

    getPathFromId(req.params.id).then(function(video) {
      //const videoPath = path.join(__dirname, video.path)
      if (video == null) {
        res.redirect('/');
      }
      const path = video.path
      const stat = fs.statSync(path)
      const fileSize = stat.size
      const range = req.headers.range
  
      if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      var  start = parseInt(parts[0], 10)
      var end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize-1
  
      var chunksize = (end-start)+1

      // poor hack to send smaller chunks to the browser
      var maxChunk = 1024 * 1024; // 1MB at a time
      if (chunksize > maxChunk) {
        end = start + maxChunk - 1;
        chunksize = (end - start) + 1;
      }

      const file = fs.createReadStream(path, {start, end})
      const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
      }
  
      res.writeHead(206, head)
      file.pipe(res)
      } else {
      const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      }
      res.writeHead(200, head)
      fs.createReadStream(path).pipe(res)
      }
    });
    
  });
  