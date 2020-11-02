const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
    title: {type:String, required: true, max:50},
    short_description: {type:String, required: true, max:100},
    details: String,
    img_url: String,
    enable: Boolean,
    published_date: Date,
    user_created: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    interest: [{
        moment_registered: Date,
        user_interested: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    }]
}, { timestamps: true });

const Idea = mongoose.model('Idea', ideaSchema);

module.exports = Idea;
