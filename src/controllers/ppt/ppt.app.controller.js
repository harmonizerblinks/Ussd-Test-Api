const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/mongodb.config.js');
let sessions = {};
// let types = ["", "Current", "Savings", "Susu"];
// let maritalArray = ["", "Single", "Married", "Divorced", "Widow", "Widower", "Private"];
// let genderArray = ["", "Male", "Female"]

// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5003/ussd/";

// let access = { code: "ARB", key: "10198553" };
let access = { code: "446785909", key: "164383692" };

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

exports.setPassword = async(req, res) => {

};

exports.changePassword = async(req, res) => {
    
};

exports.getMember = async(req, res) => {

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
    const id = req.user.mobile;
    const oldpassword = req.body.password;
    const password = req.body.newpassword;
    await fetchCustomer(menu.args.phoneNumber, (data)=> { 
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

// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    console.log(args);
    menu.run(args, ussdResult => {
        menu.session.set('network', args.Operator);
        res.send(ussdResult);
    });
};


function buyAirtime(phone, val) {
    return true
}

async function postCustomer(val, callback) {
    var api_endpoint = apiurl + 'CreateCustomer/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                console.log(resp.error);
                // return res;
                await callback(resp);
            }
            console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
    return true
}

async function fetchCustomer(val, callback) {
    // try {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                menu.session.set('name', response.fullname);
                menu.session.set('mobile', val);
                menu.session.set('accounts', response.accounts);
                menu.session.set('cust', response);
                menu.session.set('pin', response.pin);
                // menu.session.set('limit', response.result.limit);
            }

            await callback(response);
        });
    // }
    // catch(err) {
    //     console.log(err);
    //     return err;
    // }
}

async function fetchBalance(val, callback) {
    var api_endpoint = apiurl + 'getBalance/' + access.code + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error);
            await callback(resp);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if(response.balance)
        {
            menu.session.set('balance', response.balance);
        }
        
        await callback(response);
    });
}


async function postDeposit(val, callback) {
    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // console.log(JSON.stringify(val));
        if (resp.error) { 
            console.log(resp.error);
            await postDeposit(val);
            await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        console.log(response);
        await callback(response);
    });
    return true
}

async function postWithdrawal(val, callback) {
    var api_endpoint = apiurl + 'Withdrawal/' + access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // if (res.error) throw new Error(res.error); 
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
    return true
}

async function postChangePin(val, callback) {
    var api_endpoint = apiurl + 'Change/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // if (resp.error) throw new Error(resp.error); 
        console.log(resp.raw_body);      
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
    return true
}


async function getCharge(val, callback) {
    var amount = value 
    return true
}
