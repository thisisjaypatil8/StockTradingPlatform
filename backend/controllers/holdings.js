const Holdings = require("../model/HoldingsModel");

module.exports.getAllHoldings = async(req, res) =>{
        // only Loggedin user's data will send to client
        const allHoldings = await Holdings.find({user:req.user.id});
        res.status(200).json(allHoldings);
};