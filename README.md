# local-media-server
NodeJS Local media server
# WIP

# Run it !

Start mongodb
```
service mongodb start
```

Start the app
```
npm run start
```

# How it works

Put {movies (.mp4)} in ```/library```. Start MongoDB. Start the app. Go to [localhost:8000](https://localhost:8000).
Each movie/file in the library folder will generate a link. For exemple: ```localhost:8000/ABCDE``` with a video stream at ```localhost:8000/video/ABCDE```. And voila.


# Technical things

The video player uses Video.js player, because Firefox is, sometimes, not able to deal with some videos which results in issues with video controls and audio.

# Known issues

The application only supports .mp4 files with correct video and audio codecs. 
The list of supported video and audio codecs depends on the browser.
Prefered codecs : .MP4 format -> h.264 video and AAC audio

# Future

- [ ] Add a .NET service to automatically handle unprocessed videos. It will use ffmpeg to convert them into MP4 (H264, AAC) using a queue and a database, to make sure it is well-processed by the browser. 
- [ ] Add style please
