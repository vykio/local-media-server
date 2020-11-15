const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
    id: String,
    path: String,
    created: Date
});

module.exports.Video = mongoose.model('Video', videoSchema);