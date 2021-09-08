const mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId;
const User = require('../models/user.model.js');
// const Package = require('../models/package.model.js');
// const Insurance = require('../models/insurance.model.js');
const unirest = require('unirest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/mongodb.config.js');
const nodemailer = require("nodemailer");

//Integration Setup
let accesses = [{ code: "PPT", key: "178116723" },{ code: "ACU001", key: "1029398" },{ code: "ACU001", key: "1029398" }];
const apiUrl = "https://app.alias-solutions.net:5003/";
const apiurl = "https://app.alias-solutions.net:5003/";


exports.getMerchant = (req, res) => {
    var api_endpoint = apiurl + 'App';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            console.log(resp.raw_body);
            res.status(500).send({ 
                success: false, message: resp.error 
            });
        }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        res.send(response);
    });
};

exports.validateOfficer = (req, res) => {
    const access = getkey(req.params.merchant);
    const val = req.params.mobile;
    var api_endpoint = apiurl + 'ussd/getOfficer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Provide the following details to Signup', error: resp 
            });
        }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if (response.active && response.pin != null) {
            res.send({
                success: true, register: true, pin: true
            });
        } else if (response.active && response.pin == null) {
            res.send({
                success: true, register: true, pin: false
            });
        } else {
            res.send({
                success: false, register: false, pin: false, message: 'Provide the following details to Signup',
            });
        }
    });
};


exports.sendOtp = async(req, res) => {
    var val = req.body;
    var api_endpoint = apiurl + 'otp/'+ val.mobile + '/'+ val.merchant +'?id=AGENT';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ success: false, message: 'Unable to sent Otp' });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        res.send({
            success: true, message: response.message
        });
    });
}

exports.verifyOtp = async(req, res) => {
    var val = req.body;
    
    // var api_endpoint = apiurl + 'otp/'+ val.mobile + '/'+ val.merchant +'?id=AGENT';
    var api_endpoint = apiurl + 'otp/verify/' + val.mobile + '/'+ val.otp+ '/'+ val.merchant +'&id=AGENT';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ success: false, message: 'Code Not Valid' });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        res.send({
            success: true, message: response.message
        });
    });
}

exports.setPassword = async(req, res) => {
    var mobile = req.body.mobile;
    console.log(mobile);
    // if (mobile && mobile.startsWith('+')){ mobile = mobile.replace('+', ''); } 
    console.log(mobile);
    const newpin = bcrypt.hashSync(req.body.newpin, 10);
    if (mobile == null || req.body.newpin == null) {
        return res.status(500).send({
            message: "Mobile Number and Pin is Required"
        });; 
    }

    var value = { type: "Customer", mobile: mobile, pin: newpin, newpin: newpin, confirmpin: newpin };
    console.log(JSON.stringify(value));
    var api_endpoint = apiurl + 'Change/'+access.code+'/'+access.key;
    console.log(api_endpoint)
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(value))
        .end( async(resp)=> { 
            if (resp.error) {
                console.log(resp.raw_body);
                return res.status(500).send({
                    message: "Error updating Officer Pin "
                });; 
            }
            console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            console.log(response, response.code);
            if (response.code != 1) {
                return res.status(500).send({
                    message: "Error While Setting User Pin"
                });; 
            }
            res.send({
                message: "Password Set successfully"
            });
        });
};

// Login user
exports.login = (req, res) => {
    var val = req.body.mobile;
    const access = await getkey(val.merchant);
    var api_endpoint = apiurl + 'getOfficer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Invalid Mobile Number' 
            });
        }
        console.log(resp.raw_body);
        var data = JSON.parse(resp.raw_body);
        if (data.active && data.pin == null) {
            res.send({
                success: true, register: true, pin: false
            });
        }
        var passwordIsValid = bcrypt.compareSync(req.body.pin, data.pin);
        if (passwordIsValid) {
            const token = jwt.sign({
                type: 'user',
                data: {
                    id: "AGENT",
                    officerid: data.officerid,
                    code: data.code,
                    fullname: data.fullname,
                    mobile: data.mobile,
                    merchant: data.merchant,
                },
            }, config.secret, {
                expiresIn: '24h'
            });
            console.log(token);
            res.send({ success: true, access_token: token, date: Date.now });
        } else {
            res.status(500).send({ success: false, message: 'Password is not correct' });
        }
    });
};

// Logout user
exports.logout = (req, res) => {
    if (req.user) {
        res.send({
            message: "Logout succesful"
        });
    } else {
        res.status(401).send({
            message: "Authentication not Valid"
        });
    }
};

// Get User Profile
exports.profile = (req, res) => {
    if (req.user) {
        
        res.send(req.user);
    } else {
        res.status(401).send({
            message: "Authentication not Valid"
        });
    }
    // res.status(401).send({
    //     message: "Authentication not Valid"
    // });
};

// Change Password
exports.changePassword = async(req, res) => {
    // const mobile = req.user.mobile;
    // const pin = req.body.pin;
    var val = req.user.mobile;
    const access = await getkey(req.user.merchant);
    var api_endpoint = apiurl + 'getOfficer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Invalid Mobile Number' 
            });
        }
        console.log(resp.raw_body);
        var data = JSON.parse(resp.raw_body);
        if (data.active && data.pin == null) {
            res.send({
                success: true, register: true, pin: false
            });
        }
        var passwordIsValid = bcrypt.compareSync(req.body.pin, data.pin);
        if (passwordIsValid) {
            const newpin = bcrypt.hashSync(req.body.newpin, 10);
            var value = { type: 'Officer', mobile: mobile, pin: pin, newpin: newpin, confirmpin: newpin };
            var api_endpoint = apiurl + 'Ussd/Change/'+access.code+'/'+access.key;
            var req = unirest('POST', api_endpoint)
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify(value))
            .end( async(resp)=> { 
                if (resp.error) {
                    return res.status(500).send({
                    message: "Error updating user Password "
                    });; 
                }
                // console.log(resp.raw_body);
                res.send({
                    message: "Password Changed successfully"
                });
            });
        } else {
            res.status(500).send({ success: false, message: 'Current Password is not correct' });
        }
    });
};

exports.getCustomers = async(req, res) => {
    // var val = req.user.mobile;
    const access = await getkey(req.user.merchant);
    var api_endpoint = apiurl + 'App/getCustomers/' + access.code + '/' + access.key + '?' + req.query;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Provide the following details to Signup', error: resp 
            });
        }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if (response.active && response.pin != null) {
            res.send({
                success: true, register: true, pin: true
            });
        } else if (response.active && response.pin == null) {
            res.send({
                success: true, register: true, pin: false
            });
        } else {
            res.send({
                success: false, register: false, pin: false, message: 'Provide the following details to Signup',
            });
        }
    });
};

exports.getCustomer = async(req, res) => {
    var val = req.params.code;
    const access = await getkey(req.user.merchant);
    var api_endpoint = apiurl + 'Ussd/getCustomer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Provide the following details to Signup', error: resp 
            });
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        res.send(response);
    });
};

exports.getAccounts = async(req, res) => {
    var mobile = req.params.mobile;
    if (mobile && mobile.startsWith('0')) {
        // Remove Bearer from string
        mobile = '+233' + mobile.substr(1);
    }else if(mobile && mobile.startsWith('233')) {
        // Remove Bearer from string
        mobile = '+233' + mobile.substr(3);
    }
    // if (val && val.startsWith('+')){ val = val.replace('+', ''); } 
    var api_endpoint = apiurl + 'getCustomer/Personal/' + access.code + '/' + access.key + '/' + mobile;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(200).send({ 
                success: false, register: false, error: resp 
            });
        }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if (response.active) {
            res.send({
                success: true, register: true, data: response
            });
        } else {
            res.send({
                success: false, register: false, data: response
            });
        }
    });
};

exports.getGroups = async(req, res) => {
    var val = req.params.scheme;   
    var api_endpoint = apiurl + 'Schemeinfo/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Current Password is not correct' 
            });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        response.pin = null;
        res.send(response.payments);
    });
};

exports.getGroup = async(req, res) => {
    var val = req.params.scheme;   
    var api_endpoint = apiurl + 'Schemeinfo/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Current Password is not correct'
            });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        // response.pin = null;
        res.send(response);
    });
};


exports.getStatement = (req, res) => {
    var val = req.body;
    console.log(val);
    console.log('getstatement');
    var api_endpoint = apiurl + 'Ussd?AppId=' + chanel.code + '&AppKey=' + chanel.key+ '&SchemeNumber=' + val.schemenumber + '&EndDate=' + val.enddate;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    // .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber }))
    .end((resp)=> { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        res.send(response.result);
    });
};

// Post Payment
exports.Deposit = (req, res) => {
    
    const access = await getkey(req.user.merchant);
    var val = req.body;
    // var method = "";
    var value = { account:val.account,type:'Deposit',network:val.network,mobile:mobile,amount:val.amount,method:val.method,source:"Officer", withdrawal:false, reference:'Deposit to Account Number '+val.account };

    var api_endpoint = apiurl + 'App/Agent/Deposit/'+access.code+'/'+access.key;
    console.log(api_endpoint);
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end( async(resp)=> { 
        if (resp.error) { 
            console.log(resp.raw_body);
            var respon = JSON.parse(resp.raw_body);
            // if (response.error) throw new Error(response.error);
            return res.status(500).send({
                message: respon.message || "Unable to proccess Payment at the moment"
            });
        }
        // if (res.error) throw new Error(res.error);
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        // await callback(response);
        res.send({ output: 'Payment Request Sent', message: response.message });
    });
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function getkey(code) {
    return accesses.filter((ele)=>{
        return ele.code != code;;
    });
}

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

