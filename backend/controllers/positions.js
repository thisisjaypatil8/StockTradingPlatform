const Positions = require("../model/PositionsModel");

module.exports.getAllPositions = async (req, res) => {
    const allPositions = await Positions.find({user: req.user.id});
    res.status(200).json(allPositions);
};