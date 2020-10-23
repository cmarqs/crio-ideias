const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
    title: {type:String, required: true, max:50},
    short_description: {type:String, required: true, max:100},
    details: String,
    img_url: String,
    enable: Boolean,
    published_date: Date,
    user_id_created: { type: mongoose.Schema.Types.ObjectId, ref: 'ideas'},

    interest: [{
        user_id_interested: { type: mongoose.Schema.Types.ObjectId, unique: true},
        moment_registered: Date
    }]
}, { timestamps: true });

const Idea = mongoose.model('Idea', ideaSchema);

module.exports = Idea;
