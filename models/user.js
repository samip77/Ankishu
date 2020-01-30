const mongoose = require('mongoose');
const Schema = mongoose.Schema;



var UserSchema = new Schema({
    username: String,
    password: String,
    googleId: String,
});

const passportLocalMongoose = require('passport-local-mongoose');
UserSchema.plugin(passportLocalMongoose);

const findOrCreate = require('mongoose-findorcreate');
UserSchema.plugin(findOrCreate);

module.exports = mongoose.model('User', UserSchema);