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
const appKey = '3456789'; const appId = '12345678';
const apiUrl = "https://pensionsapi.bitcloud.solutions:8446/api/services/app/Channels/";

// POST a User
exports.createUser = async(req, res) => {
    console.log(req.body);
    const user = new User(req.body);
    user.password = bcrypt.hashSync(req.body.password, 10);
    user.email = req.body.email.toLowerCase();

    user.save()
        .then(async(data) => {
            console.info('saved successfully');
            const token = jwt.sign({
                type: 'user',
                data: {
                    id: data._id,
                    fullname: data.fullname,
                    isAdmin: data.isAdmin,
                    mmobile: data.mobile,
                    email: user.email
                },
            }, config.secret, {
                expiresIn: 684800
            });
            console.log(token);
            res.send({ success: true, access_token: token, date: Date.now });
            // res.send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message
            });
        });
};


// Logout user
exports.logout = (req, res) => {
    if (req.user) {
        User.findById(req.user.id)
            .then(user => {

                user.isLogin = true;
                user.access_token = null;
                User.findByIdAndUpdate(user._id, user, { new: true });
                res.send({ output: 'Logout', mesaage: 'you have been logout successfully' });
            }).catch(err => {
                return res.status(200).send({
                    message: "you have been logout successfully"
                });
            });
        // res.send(req.user);
    } else {
        res.status(401).send({
            message: "Authentication not Valid"
        });
    }
};

// Get User Profile
exports.profile = (req, res) => {
    if (req.user) {
        User.findById(req.user.id)
            .then(user => {
                if (!user) {
                    return res.status(404).send({
                        message: "User not found with id " + req.params.userId
                    });
                }
                // user[0].password = null;
                res.send(user[0]);
            }).catch(err => {
                if (err.kind === 'ObjectId') {
                    return res.status(404).send({
                        message: "User not found with id " + req.params.userId
                    });
                }
                return res.status(500).send({
                    message: "Error retrieving User with id " + req.params.userId
                });
            });
        // res.send(req.user);
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
exports.changePassword = (req, res) => {
    const id = req.user.id;
    const oldpassword = req.body.password;
    const password = req.body.newpassword;

    User.findById(id)
        .then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "User not found with username " + username
                });
            }

            var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (passwordIsValid) {
                user.password = bcrypt.hashSync(req.body.newpassword, 10);

                User.findByIdAndUpdate(id, user, { new: true })
                    .then(use => {
                        if (!use) {
                            return res.status(404).send({
                                message: "User not found with id " + req.params.userId
                            });
                        }
                        res.send({
                            message: "Password Changed successfully"
                        });
                    }).catch(err => {
                        if (err.kind === 'ObjectId') {
                            return res.status(404).send({
                                message: "Invalid User "
                            });
                        }
                        console.log(err);
                        return res.status(500).send({
                            message: "Error updating user Password "
                        });
                    });
            } else {
                res.status(500).send({ success: false, message: 'Password is not correct' })
            }
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "User not found with username " + username
                });
            }
            return res.status(500).send({
                message: "Error retrieving User with username " + username
            });
        });
};

// FETCH Member Info
exports.memberInfo = (req, res) => {
    console.log('member info');
    var reqs = unirest('POST', apiUrl + 'memberInfo')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId": appId,"appKey":appKey,"mobile":"233244889745"}))
    .end(function (resp) { 
        if (resp.error) {
            res.status(404).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};

// create Member PIN
exports.createPin = (req, res) => {
    console.log('createPin');
    var req = unirest('POST', apiUrl + 'createPin')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.user.mobile,"pin":req.body.pin}))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
        // if (res.error) throw new Error(res.error); 
        // console.log(res.raw_body);
    });
};

// change Member PIN
exports.changePin = (req, res) => {
    console.log('changepin');
    var req = unirest('POST', apiUrl + 'changePin')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.user.pin,"pin":req.body.pin,"newPin":req.body.pin}))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};

// check balance
exports.checkbalance = (req, res) => {
    console.log('check Balance');
    var req = unirest('POST', apiUrl + 'checkbalance')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"schemeNumber":req.body.schemenumber,"pin":req.body.pin }))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};


// mini Statement
exports.miniStatement = (req, res) => {
    console.log('mini Statement');
    var req = unirest('POST', apiUrl + 'miniStatement')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"schemeNumber":req.body.schemenumber,"pin":req.body.pin }))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};


// Statement
exports.statement = (req, res) => {
    console.log('Statement');
    var req = unirest('POST', apiUrl + 'Statement')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"schemeNumber":req.body.schemenumber,"startDate":req.body.start,"endDate":req.body.end,"pin":req.body.pin }))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};


// Scheme Beneficiaries
exports.schemeBeneficiaries = (req, res) => {
    console.log('SchemeBeneficiaries');
    var req = unirest('POST', apiUrl + 'SchemeBeneficiaries')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"schemeNumber":req.body.schemenumber,"pin":req.body.pin }))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};


// agent info
exports.agentinfo = (req, res) => {
    console.log('agentinfo');
    var req = unirest('POST', apiUrl + 'agentinfo')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber }))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};

// agent Payment
exports.agentPayment = (req, res) => {
    console.log('mini Statement');
    var req = unirest('POST', apiUrl + 'agentPayment')
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({"appId":appId,"appKey":appKey,"schemeNumber":req.body.schemenumber,"pin":req.body.pin }))
    .end(function (res) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};


// Post Payment
exports.Makepayment = (req, res) => {
    // var req = unirest('POST', 'http://api.alias-solutions.net:8443/chatbotapi/paynow/merchant/payment')
    var request = unirest('POST', req.body.payment.apiurl)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(req.body.payment))
        .end(function(response) {
            if (response.error) throw new Error(response.error);
            console.log(response.raw_body);
            var body = req.body;
            // console.log(body)
            body.response = JSON.parse(response.raw_body);
            body.updated = new Date();
            // Find insurance and update it
            Insurance.findByIdAndUpdate(body._id, body, { new: true })
                .then(insurance => {
                    if (!insurance) {
                        return res.status(404).send({
                            message: "Insurance not found with id " + req.params.insuranceId
                        });
                    }
                    console.log(body.response);
                    setTimeout(() => { getCallBack(insurance, body.response.transaction_no); }, 100000);
                    // var callback = setTimeout(getCallBack(insurance, body.response.transaction_no), 100000);
                    res.send({ output: 'Payment Request Sent', message: "Kindly Confirm Payment Prompt on your phone", insure: insurance });
                }).catch(err => {
                    if (err.kind === 'ObjectId') {
                        return res.status(404).send({
                            message: "Insurance not found with id " + req.params.insuranceId
                        });
                    }
                    return res.status(500).send({
                        message: "Error updating insurance with id " + req.params.insuranceId
                    });
                });
        });
};

function getCallBack(body, code) {
    var req = unirest('GET', 'https://api.paynowafrica.com/paynow/confirmation/' + code)
        .end(function(res) {
            if (res.error) throw new Error(res.error);
            console.log(res.raw_body);
            body.callback = JSON.parse(res.raw_body);
            body.updated = new Date();
            if (body.callback.status_code === 0 || body.callback.status_code === 2) {
                setTimeout(() => { getCallBack(body, body.response.transaction_no); }, 100001);
                // var callback = setTimeout(getCallBack(body, body.response.transaction_no), 200000);
            } else {
                body.status = body.callback.status_message;
                Insurance.findByIdAndUpdate(body._id, body, { new: true })
                    .then(insurance => {
                        if (!insurance) {
                            return {
                                message: "Insurance not found with id " + body._id
                            };
                        }

                        return insurance;
                    }).catch(err => {
                        if (err.kind === 'ObjectId') {
                            return {
                                message: "Insurance not found with id " + body._id
                            };
                        }
                        return {
                            message: "Error updating insurance with id " + req.params.insuranceId
                        };
                    });
            }

        });
}


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
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

// async..await is not allowed in global scope, must use a wrapper
async function main(value) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"'+ value.website +'" <'+ value.from +'>', // sender address
    to: value.to, // "bar@example.com, baz@example.com", // list of receivers
    subject: value.subject, // "Hello ✔", // Subject line
    text: "Sending Mail with Harmony Mailer", // plain text body
    html: `<h1>Hello,</h1><h2>below are the details: </h2>Name:  $lname<br>Email: $email<br>Phone: $ctype<br>Gift Selected: $gtype<br>Address: $address<br>ID: $id<br>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}