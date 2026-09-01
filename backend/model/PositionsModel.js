const { model } = require("mongoose");
const PositionsSchema = require("../schemas/PositionsSchema");

const Positions = model("Positions", PositionsSchema);

module.exports = Positions;