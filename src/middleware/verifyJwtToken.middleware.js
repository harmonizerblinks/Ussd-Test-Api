const jwt = require('jsonwebtoken');
const config = require('../config/mongodb.config.js');
// const User = require('../models/user.model.js');
// const Role = require('../models/role.model.js');

verifyToken = async(req, res, next) => {
    // console.log(req.headers);
    // let token = req.headers['authorization'];
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (!token) {
        return res.status(403).send({
            auth: false,
            message: 'No token provided.'
        });
    }
    // console.log(token);
    if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }

    jwt.verify(token, config.secret, async(err, decoded) => {
        if (err) {
            return res.status(401).send({
                auth: false,
                message: 'Fail to Authentication. Error -> ' + err
            });
        }
        // console.log(decoded);
        req.user = decoded.data;
        req.body.muserid = decoded.data.id;
        // if (req.body.userid == null) { req.body.userid = decoded.data.id; }
        // if (req.body.code == null || req.body.code == '') {
        //     req.body.code = await generateOTP(6);
        //     console.log(req.body.code);
        // }
        // console.log(req.body);

        next();
    });
}

isAdmin = (req, res, next) => {

    if (!req.user.isAdmin) {
        return res.status(401).send({
            message: "You are not Authorized to perform this Action"
        });
    }

    next();
}


const authJwt = {
    verifyToken: verifyToken,
    isAdmin: isAdmin
};

module.exports = authJwt;

async function generateOTP(length) {
    var digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var otpLength = length;
    var otp = '';

    for (let i = 1; i <= otpLength; i++) {
        var index = Math.floor(Math.random() * (digits.length));

        otp = otp + digits[index];
    }
    return otp.toUpperCase();
}