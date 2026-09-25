const Orders = require("../model/OrdersModel");
const orderService = require("../services/orderService");

module.exports.getAllOrders = async (req, res) => {
    // Explicit timestamp sorting
    const allOrders = await Orders.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json(allOrders);
};

module.exports.createOrder = async (req, res) => {
    const executedOrder = await orderService.executeOrder({
        userId: req.user.id,
        ...req.body
    });

    res.status(200).json({
        success: true,
        message: `${req.body.mode} order executed & holdings updated successfully!`,
        order: executedOrder
    });
};
