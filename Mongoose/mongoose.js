const config = require('../config.js');
const mongoose = require('mongoose');

mongoose.connect(config.mongoURL, {useNewUrlParser: true});

let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

module.exports = db;