const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

let userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please specify a username!'],
        minLength: [4, 'usernames must be four characters long!'],
        unique: [true, 'Username already exists!']
    },
    password: {
        type: String,
        required: [true, 'Please specify a password!'],
        minLength: [4, 'passwords must be four characters long!']
    },
    friends:  {type: [String], default: []},
    requests: {type: [String], default: []},
    online: {type: Boolean, default: false},
    signedIn: {type: Boolean, default: false},
    lastActive: {type: Date, default: Date.now},
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
    activeGames: {type: [Schema.Types.ObjectId], default: []},
    gameRequests: {type: [{
            username: {
                type: String,
                required: [true, 'game requests require a username']
            },
            privacy: {
                type: Number,
                min: [-1, 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'],
                max: [1, 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'],
                validate: {
                    validator: Number.isInteger,
                    message: 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'
                },
                default: 1,
                required: [true, 'game requests require a username']
            }
        }],
        default: []},
    history: {type: [Schema.Types.ObjectId], default: []}
});

userSchema.plugin(uniqueValidator); // https://github.com/blakehaswell/mongoose-unique-validator

userSchema.statics.findUserByUsername = async function (username) {
    let user = await this.findOne().where('username').equals(username).then(
        (doc) => {
            return doc;
        },
        (err) => {
            console.log(err);
            return null;
        });
    return user;
}

userSchema.statics.freeUsername = async function (username) {
    let ret = await this.find().where('username').equals(username).then((result) => {
        return result.length === 0;
    });
    return ret;
}

userSchema.statics.searchUsernames = async function (toSearch) {
    let regex = new RegExp("^" + toSearch, "i");

    let results = await this.find({username: {$regex: regex}}).then(
        (docs) => {
            let r = [];
            for (let i in docs) {
                r.push(docs[i].toObject());
            }
            return r;
        },
        (err) => {
            console.log(err);
            return [];
        });

    return results;
}

userSchema.statics.updateStatus = function () {
    this.find().exec((err, result) => {
        if (err)
            return console.error(err)
        for (let i in results) {
            let userModel = results[i];
            if (Date.now() - userModel.toObject().lastActive > 300000) {
                userModel.online = false;
                userModel.save((err, u) => {
                    if (err)
                        console.log(err);
                });
            }
        }
    });
}

module.exports = mongoose.model('users', userSchema);