const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const c4f = require('../modules/game/connect4ServerModule.js').Connect4Funcs;
const connect4Funcs = new c4f();

let gameSchema = mongoose.Schema({
    blueTurn: {type: Boolean, default: false},
    blueName: {type: String, required: [true, 'Please specify the blue players username!']},
    redName: {type: String, required: [true, 'Please specify the red players username!']},
    winner: {
        type: Number,
        min: [-1, 'Invalid winner please use -1 for undecided, 0 for blue wins, and 1 for red wins.'],
        max: [1, 'Invalid winner please use -1 for undecided, 0 for blue wins, and 1 for red wins.'],
        validate: {
            validator: Number.isInteger,
            message: 'Invalid winner please use -1 for undecided, 0 for blue wins, and 1 for red wins.'
        },
        default: -1
    },
    board: {type: [[Number]], default: Array.from({length: 7}, () => ([-1, -1, -1, -1, -1, -1]))},
    history: {type: [Number], default: []},
    privacy: {
        type: Number,
        min: [-1, 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'],
        max: [1, 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'],
        validate: {
            validator: Number.isInteger,
            message: 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'
        },
        default: 1
    },
    chat: {type: [{username: String, text: String}], default: []},
    active: {type: Boolean, default: true}
});

gameSchema.statics.getGameById = async function (id) {
    return await this.findById(id).then(
        (doc) => {
            return doc;
        },
        (err) => {
            console.log(err);
            return null;
        });
}

gameSchema.statics.searchGames = async function (player, active) {
    if (player !== '') {
        return await this.find({$and: [{$or: [{redName: player}, {blueName: player}]}, {active: active}, {privacy: 1}]})
            .then(
            (docs) => {
                return docs;
            },
            (err) => {
                console.log(err);
                return null;
            });
    } else {
        return this.find({$and: [{active: active}, {privacy: 1}]}).then(
            (docs) => {
                return docs;
            },
            (err) => {
                console.log(err);
                return null;
            });
    }
}

module.exports = mongoose.model('Game', gameSchema);