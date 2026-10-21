const User = require("./User");
const Order = require("./Order");
const Holding = require("./Holding");
const Position = require("./Position");

module.exports = {
    User,
    Orders: Order,
    Holdings: Holding,
    Positions: Position,
};
