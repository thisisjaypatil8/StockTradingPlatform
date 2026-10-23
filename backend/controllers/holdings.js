const { Holdings } = require("../models");

module.exports.getAllHoldings = async (req, res) => {
    const allHoldings = await Holdings.find({ user: req.user.id }).lean();
    res.status(200).json(allHoldings);
};