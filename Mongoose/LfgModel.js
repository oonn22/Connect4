const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let lfgSchema = mongoose.Schema({
    username: {type: String, required: true},
    privacy: {
        type: Number,
        min: [-1, 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'],
        max: [1, 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'],
        validate: {
            validator: Number.isInteger,
            message: 'Invalid Privacy please use -1 for private, 0 for friends only, and 1 for public.'
        },
        default: 1
    }
});

lfgSchema.statics.findGame = async function (privacy, username) {
    return await this.findOne()
        .where('privacy')
        .equals(privacy)
        .where('username')
        .ne(username)
        .sort({created_at: 1})
        .then(
            (doc) => {
                return doc;
            },
            (err) => {
                console.log(err);
                return null;
            });
}

module.exports = mongoose.model('lfg', lfgSchema);