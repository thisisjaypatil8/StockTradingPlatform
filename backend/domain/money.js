function toPaise(rupees){
    if(rupees == null || isNaN(rupees)) return 0;
    const num = Number(rupees);
    return Math.sign(num) * Math.round(Math.abs(num) * 100);
}

// Converts Integer Paise -> Rupees (2 Decimals)
function toRupees(paise){
    if(paise == null || isNaN(paise)) return 0;
    return Number((Number(paise)/100).toFixed(2));
}

// Banker's safe round-half-up for division
function roundPaise(num){
    return Math.sign(num) * Math.round(Math.abs(num));
}

module.exports = {toPaise, toRupees, roundPaise}