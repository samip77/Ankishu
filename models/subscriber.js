const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubscriberSchema = new Schema({
    fName: String,
    lName: String,
    email: { type: String, required: true },
    subscriber: Boolean,
    lastUpdatedOn: { type: Date, default: Date.now() },
    createdOn: Date
})

module.exports = mongoose.model("Subscriber", SubscriberSchema);