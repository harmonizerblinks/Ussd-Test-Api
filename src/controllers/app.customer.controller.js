// const mongoose = require('mongoose'),
//     ObjectId = mongoose.Types.ObjectId;
const unirest = require('unirest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/mongodb.config.js');
const nodemailer = require("nodemailer");
const fs = require('fs');
const formidable = require('formidable');
const FormData = require('form-data');
const axios = require('axios').default;

//Integration Setup
let accesses = [{
    code: "PPT",
    key: "178116723",
    apiurl: ""
}, {
    code: "ACU001",
    key: "1029398",
    apiurl: ""
}, {
    code: "500",
    key: "1029398",
    apiurl: ""
}];
//const apiUrl = "https://app.alias-solutions.net:5003/";
const apiurl = "http://localhost:5000/";
//const apiurl = "https://app.alias-solutions.net:5003/";


exports.validateCustomer = (req, res) => {
    const { merchant, mobile } = req.params;
    const access = getkey(merchant);
    if (!access) res.status(500).send({ success: false, message: `No merchant was found with code ${merchant}` })
    var api_endpoint = apiurl + 'ussd/getCustomer/' + merchant + '/' + access.key + '/' + mobile;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                res.status(500).send({
                    success: false,
                    register: false,
                    message: 'Provide the following details to Signup',
                    error: resp
                });
            }
            var response = JSON.parse(resp.raw_body);
            if (response.active && response.pin != null && response.pin != "1234" && response.pin.length != 4) {
                res.send({
                    success: true,
                    register: true,
                    pin: true
                });
            } else if (response.active && response.pin == null) {
                res.send({
                    success: true,
                    register: true,
                    pin: false
                });
            } else {
                res.send({
                    success: false,
                    register: false,
                    pin: false,
                    message: 'Provide the following details to Signup',
                });
            }
        });
};

exports.getCustomer = async (req, res) => {
    const val = req.user;
    const access = getkey(val.merchant);
    if (!access) res.status(500).send({ success: false, message: `No merchant was found with code ${val.merchant}` })
    var api_endpoint = apiurl + `ussd/getCustomer/${val.merchant}/` + access.key + '/' + access.code + '/';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                res.status(500).send({
                    success: false,
                    message: 'Invalid Mobile Number'
                });
            }
            var response = JSON.parse(resp.raw_body);
            if (response.officerid == 0) {
                res.status(500).send({
                    success: false,
                    message: 'Invalid Mobile Number'
                })
            } else {
                res.send(response);
            }
        })
}

exports.sendOtp = async (req, res) => {
    var val = req.body;
    var api_endpoint = apiurl + 'otp/' + val.mobile + '/' + val.merchant + '?id=CUSTOMER';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                res.status(500).send({
                    success: false,
                    message: 'Unable to sent Otp'
                });
            }
            // console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            res.send({
                success: true,
                message: response.message
            });
        });
}

exports.verifyOtp = async (req, res) => {
    var val = req.body;
    // var api_endpoint = apiurl + 'otp/'+ val.mobile + '/'+ val.merchant +'?id=AGENT';
    var api_endpoint = apiurl + 'otp/verify/' + val.mobile + '/' + val.otp + '/' + val.merchant + '?id=CUSTOMER';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            console.log(resp)
            if (resp.error) {
                console.log(resp.error);
                res.status(500).send({
                    success: false,
                    message: 'Code Not Valid'
                });
            }
            // console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            res.send({
                success: true,
                message: response.message
            });
        });
}

exports.setPassword = async (req, res) => {

    if (req.body.mobile == null || req.body.newpin == null) {
        return res.status(500).send({
            message: "Mobile Number and Pin is Required"
        });
    }
    const merchant = req.body.merchant;
    const access = getkey(merchant);
    if (!access) res.status(500).send({ success: false, message: `No merchant was found with code ${merchant}` });
    var mobile = req.body.mobile;
    const newpin = bcrypt.hashSync(req.body.newpin, 10);
    var value = {
        type: "Customer",
        mobile: mobile,
        pin: newpin,
        newpin: newpin,
        confirmpin: newpin
    };
    console.log(JSON.stringify(value));
    var api_endpoint = apiurl + 'Ussd/Change/' + access.code + '/' + access.key;
    console.log(api_endpoint)
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(value))
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.body);
                return res.status(500).send({
                    message: resp.body.message || "Error updating Customer Pin "
                });;
            }
            console.log(resp.raw_body, resp.body);
            var response = JSON.parse(resp.raw_body);
            // console.log(response, response.code);
            if (response.code != 1) {
                return res.status(500).send({
                    success: false,
                    message: resp.body.message || "Error While Setting User Pin"
                });;
            }
            res.status(200).send({
                success: true,
                message: "pin Set successfully"
            });
        });
};

// Login user
exports.login = (req, res) => {
    var val = req.body;
    const access = getkey(val.merchant);
    if (!access) res.status(500).send({ success: false, message: `No merchant was found with code ${val.merchant}` })
    var api_endpoint = apiurl + 'ussd/getCustomer/' + val.merchant + '/' + access.key + '/' + val.mobile;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            console.log(resp)
            if (resp.error) {
                res.status(500).send({
                    success: false,
                    register: false,
                    message: 'Invalid Mobile Number'
                });
            }
            var data = JSON.parse(resp.raw_body);
            if (data.active && data.pin == null) {
                res.send({
                    success: true,
                    register: true,
                    pin: false
                });
            }
            // var hash = bcrypt.hashSync(data.pin);
            // // console.log(hash);
            var passwordIsValid = bcrypt.compareSync(val.pin, data.pin);
            if (passwordIsValid) {
                const token = jwt.sign({
                    type: 'user',
                    data: {
                        id: "CUSTOMER",
                        customerid: data.customerid,
                        code: data.code,
                        fullname: data.fullname,
                        mobile: data.mobile,
                        merchant: val.merchant,
                    },
                }, config.secret, {
                    expiresIn: '24h'
                });
                res.send({
                    success: true,
                    access_token: token,
                    date: Date.now
                });
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Password is not correct'
                });
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
};

// Change Password
exports.changePassword = async (req, res) => {
    const val = req.user;
    const access = await getkey(req.user.merchant);
    const { newpin: newp, pin } = req.body;
    var api_endpoint = apiurl + 'Ussd/getCustomer/' + access.code + '/' + access.key + '/' + val.mobile;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                res.status(500).send({
                    success: false,
                    register: false,
                    message: resp.body.message || 'Invalid Mobile Number'
                });
            }
            var data = JSON.parse(resp.raw_body);
            if (data.active && data.pin == null) {
                res.send({
                    success: true,
                    register: true,
                    pin: false
                });
            }
            var passwordIsValid = bcrypt.compareSync(pin, data.pin);
            if (passwordIsValid) {
                const newpin = bcrypt.hashSync(newp, 10);
                var value = {
                    type: 'Customer',
                    mobile: val.mobile,
                    pin: pin,
                    newpin: newpin,
                    confirmpin: newpin
                };
                var api_endpoint = apiurl + 'Ussd/Change/' + access.code + '/' + access.key;
                var req = unirest('POST', api_endpoint)
                    .headers({
                        'Content-Type': 'application/json'
                    })
                    .send(JSON.stringify(value))
                    .end(async (resp) => {
                        if (resp.error) {
                            return res.status(500).send({
                                message: resp.body.message || "Error updating user Password "
                            });;
                        }
                        // console.log(resp.raw_body);
                        res.send({
                            message: resp.body.message || "Pin Changed successfully"
                        });
                    });
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Current Pin is not correct'
                });
            }
        });
};

exports.getCustomers = async (req, res) => {
    // var val = req.user.mobile;
    const { page, limit, search } = req.query
    const access = await getkey(req.user.merchant);
    var api_endpoint = apiurl + `App/getCustomers/${access.code}/${access.key}?search=${search}&page=${page}&limit=${limit}`;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                res.status(500).send({
                    success: false,
                    register: false,
                    message: 'Provide the following details to Signup',
                    error: resp
                });
            }
            var response = JSON.parse(resp.raw_body);
            console.log(response);
            res.send({
                success: true,
                ...response
            })
        });
};

exports.getCustomer = async (req, res) => {
    var val = req.params.code;
    const access = await getkey(req.user.merchant);
    if (!access) res.status(500).send({ success: false, message: `No merchant was found with code ${val.merchant}` })
    var api_endpoint = apiurl + 'Ussd/getCustomer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                res.status(500).send({
                    success: false,
                    register: false,
                    message: 'Provide the following details to Signup',
                    error: resp
                });
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            res.send(response);
        });
};

exports.getAccounts = async (req, res) => {
    const { merchant, mobile } = req.user
    const access = getkey(merchant);
    if (!access) res.status(500).send({ success: false, message: `No merchant was found with code ${merchant}` })
    var api_endpoint = apiurl + `Ussd/getCustomerAccounts/${merchant}/` + access.key + '/' + mobile;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            try {
                if (resp.error) {
                    console.log(resp.error);
                    res.status(500).send({
                        success: false,
                        error: resp
                    });
                }
                var response = JSON.parse(resp.raw_body);
                res.send({
                    success: true,
                    data: response
                });
            } catch (err) { res.status(500).send({ success: false, err }) }

        });
};

exports.getStatement = async (req, res) => {
    var val = req.body;
    console.log(val);
    var api_endpoint = apiurl + 'Ussd?AppId=' + chanel.code + '&AppKey=' + chanel.key + '&SchemeNumber=' + val.schemenumber + '&EndDate=' + val.enddate;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        // .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber }))
        .end((resp) => {
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
exports.Deposit = async (req, res) => {

    const access = await getkey(req.user.merchant);
    var val = req.body;
    // var method = "";
    var value = {
        account: val.account,
        type: 'Deposit',
        network: val.network,
        mobile: mobile,
        amount: val.amount,
        method: val.method,
        source: "Customer",
        withdrawal: false,
        reference: 'Deposit to Account Number ' + val.account
    };

    var api_endpoint = apiurl + 'App/Agent/Deposit/' + access.code + '/' + access.key;
    console.log(api_endpoint);
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(value))
        .end(async (resp) => {
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
            res.send({
                output: 'Payment Request Sent',
                message: response.message
            });
        });
};

exports.createCustomer = async (req, res) => {
    const access = await getkey(req.user.merchant);
    var val = req.body;
    var api_endpoint = apiurl + 'Ussd/CreateCustomer/' + access.code + '/' + access.key;
    console.log(api_endpoint);
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.raw_body);
                var respon = JSON.parse(resp.raw_body);
                // if (response.error) throw new Error(response.error);
                return res.status(500).send({
                    message: respon.message || "Unable to create customer at the moment"
                });
            }
            // if (res.error) throw new Error(res.error);
            console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            // await callback(response);
            res.send({
                output: 'Customer Created Successfully',
                message: response.message
            });
        });
};

exports.uploadProfilePhoto = async (req, res) => {
    let form = formidable();
    form.parse(req);
    form.on("file", async (_name, file) => {
        const fileType = file.type.split('/')[1];
        const api_endpoint = apiurl + `Upload/${fileType}`;
        console.log(api_endpoint);
        const form = new FormData();
        form.append('file', fs.createReadStream(file.path), { filename: `${_name}.${fileType}`, contentType: file.type });
        try{
            const response = await axios.post(api_endpoint,form,{
                headers:{
                    ...form.getHeaders()
                }
            })
            const { data } = response;
            res.send({ message: 'File upload successfully', data})
        } catch (err) { res.status(500).send({ success: false, err }); }
    })
    return;
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function getkey(code) {
    return accesses.find((ele) => ele.code === code);
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
