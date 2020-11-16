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

# Technical things

The video player uses Video.js player, because Firefox is, sometimes, not able to deal with some videos which results in issues with video controls and audio.

# Known issues

The application only supports .mp4 files with correct video and audio codecs. 
The list of supported video and audio codecs depends on the browser.
Prefered codecs : .MP4 format -> h.264 video and AAC audio

# Future

- [ ] Add a .NET service to automatically handle unprocessed videos. It will use ffmpeg to convert them into MP4 (H264, AAC) using a queue and a database, to make sure it is well-processed by the browser. 
- [ ] Add style please
