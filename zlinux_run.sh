#!/bin/sh
npm install
mongod --dbpath=Mongo_DataBase --fork --logpath mongodb.log
node server.js
