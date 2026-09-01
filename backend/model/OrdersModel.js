const { model } = require("mongoose");
const OrdersSchema = require("../schemas/OrdersSchema");

const Orders = model("Orders", OrdersSchema);

module.exports = Orders;