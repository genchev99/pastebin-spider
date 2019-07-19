const mongoose = require("mongoose");

const pasteSchema = new mongoose.Schema({
  content: {type: String, default: null},
  url: {type: String, default: "https://pastebin.com/"},
  information: {
    author: {type: String, default: null},
    pastedAt: {type: Number, default: 0},
    visits: {type: Number, default: 0},
    syntax: {type: String, default: "text"},
  },
}, {
  timestamps: true,
});

pasteSchema.index({url: 1},{unique: true});
pasteSchema.index({content: "text"});

const pasteModel = mongoose.model("pastes", pasteSchema);

module.exports = pasteModel;
