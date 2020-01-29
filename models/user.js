const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: String,
    password: String,
    googleId: String,
});

const passportLocalMongoose = require('passport-local-mongoose');
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);