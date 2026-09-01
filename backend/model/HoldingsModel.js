const { model } = require("mongoose");
const holdingsSchema = require("../schemas/HoldingsSchema");

const Holdings = model("Holdings", holdingsSchema);

module.exports = Holdings;