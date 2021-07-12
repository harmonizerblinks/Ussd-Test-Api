const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config/mongodb.config.js');
const { response } = require('express');
let sessions = {};
// let maritalArray = ["", "Single", "Married", "Divorced", "Widow", "Widower", "Private"];
let genderArray = ["", "Male", "Female"]

// let apiurl = "http://localhost:5000/Ussd/";
let apiurl = "https://app.alias-solutions.net:5008/ussd/";
let apiurl1 = "https://app.alias-solutions.net:5008/otp/";

// let access = { code: "ARB", key: "10198553" };
let access = { code: "446785909", key: "164383692" };

// POST a User
exports.Register = async(req, res) => {
    console.log(req.body);
    const user = new User(req.body);
    user.password = bcrypt.hashSync(req.body.password, 10);
    user.email = req.body.email.toLowerCase();

};

exports.sendOtp = async(req, res) => {
    var val = req.body;
       
    var api_endpoint = apiurl1  + val.mobile + '/' + val.type + '?id=' + val.source;
    // console.log(api_endpoint);
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
    const val = req.body;
       
    var api_endpoint = apiurl1 + 'verify/' + val.mobile + '/' + val.otp + '?id=' + val.source;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ success: false, register: false, message: 'Code Not Valid' });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        res.send({
            success: true, message: response.message
        });
    });
}

exports.setPassword = async(req, res) => {
    const mobile = req.body.mobile;
    const newpin = bcrypt.hashSync(req.body.newpin, 10);
    if (mobile == null || req.body.newpin == null) {
        return res.status(500).send({
            message: "Mobile Number and Pin is Required"
        });; 
    }
    var value = { type: 'Customer', mobile: mobile, pin: newpin, newpin: newpin, confirmpin: newpin };
    var api_endpoint = apiurl + 'Change/'+access.code+'/'+access.key;
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
                message: "Password Set successfully"
            });
        });
};

exports.getMember = async(req, res) => {
    const val = req.params.mobile;
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
    }    
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Mobile Number does not Exist' 
            });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        if (response.active && response.pin == null) {
            res.send({
                success: true, register: true, pin: false
            });
        }
    });
};


exports.getScheme = async(req, res) => {
    const val = req.params.scheme;   
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

exports.getSchemeinfo = async(req, res) => {
    const val = req.params.scheme;   
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
        res.send(response);
    });
};

exports.getMemberinfo = async(req, res) => {
    const val = req.user.mobile;
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
    }    
    var api_endpoint = apiurl + 'Memberinfo/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'User Record not Found' 
            });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        response.pin = null;
        res.send(response);
    });
};

// Login user

exports.login = (req, res) => {
    const val = req.body.mobile;
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
    }    
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Password is not correct' 
            });
        }
        
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
                    id: data.code,
                    fullname: data.fullname,
                    mobile: data.mobile,
                    email: data.email,
                    scheme: data.accounts[0].code
                },
            }, config.secret, {
                expiresIn: 684800
            });
            console.log(token);
            res.send({ success: true, access_token: token, date: Date.now });
        } else {
            res.status(500).send({ success: false, message: 'Password is not correct' });
        }
        // console.log(resp.body);
        // var response = JSON.parse(resp.raw_body);
        // res.send(response);
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
    const mobile = req.user.mobile;
    const pin = req.body.pin;
    // const newpin = req.body.newpin;
    await fetchCustomer(mobile, (data)=> { 
        if (!data || !data.active) {
            return res.status(404).send({
                message: "User not found with mobile " + mobile
            });
        }
        var passwordIsValid = bcrypt.compareSync(req.body.pin, data.pin);
        if (passwordIsValid) {
            const newpin = bcrypt.hashSync(req.body.newpin, 10);
            var value = { type: 'Customer', mobile: mobile, pin: pin, newpin: newpin, confirmpin: newpin };
            var api_endpoint = apiurl + 'Change/'+access.code+'/'+access.key;
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
    }).catch(err => {
        return res.status(500).send({
            message: "Error retrieving Member with mobile " + mobile
        });
    });
};

// Post Statement
exports.Statement = (req, res) => {
    const val = req.body;
    
    val.appid = access.code; val.appkey = access.key;

    var api_endpoint = apiurl + 'Statement';
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error);
            // if (response.error) throw new Error(response.error);
            return res.status(500).send({
                message: resp.error
            });
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        // await callback(response);
        res.send(response.payments);
    });
};


// Post Payment
exports.Deposit = (req, res) => {
    const val = req.body;
    
    var value = { merchant:access.code,account:val.code,type:'Deposit',network:val.network,mobile:val.mobile,amount:amount,method:val.method,source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+val.code,merchantid:val.merchantid};

    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end( async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error);
            // if (response.error) throw new Error(response.error);
            return res.status(500).send({
                message: resp.error
            });
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        // await callback(response);
        res.send({ output: 'Payment Request Sent', message: response.message });
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
    // console.log(1 ,api_endpoint);
    // console.log(2 ,val);
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async(resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                console.log(resp.error);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                menu.session.set('name', response.name);
                menu.session.set('mobile', val);
                menu.session.set('accounts', response.accounts);
                menu.session.set('cust', response);
                menu.session.set('pin', response.pin);
                // menu.session.set('limit', response.result.limit);
            }
            await callback(response);
        });
    return true
}

async function getInfo(val, callback) {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
    }    

    var api_endpoint = apiurl + 'getInfo/' + access.code + '/' + access.key + '/' + val;
    var req = unirest('GET', api_endpoint)
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
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
    return true
}

async function postIcareCustomer(val, callback) {
    var api_endpoint = apiurl + 'CreateIcare/' + access.code + '/' + access.key;
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
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
    return true
}

async function fetchIcareCustomer(val, callback) { 
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }
    var api_endpoint = apiurl + 'getIcare/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                // menu.session.set('name', response.fullname);
                // menu.session.set('mobile', val);
                // menu.session.set('accounts', response.accounts);
                // menu.session.set('cust', response);
                // menu.session.set('pin', response.pin);
                // menu.session.set('limit', response.result.limit);
            }

            await callback(response);
        });
}

async function fetchCustomer(val, callback) {
    // try {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233', '0');
        }else if(val && val.startsWith('233')) {
            // Remove Bearer from string
            val = val.replace('233', '0');
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
            // console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                // menu.session.set('name', response.fullname);
                // menu.session.set('mobile', val);
                // menu.session.set('accounts', response.accounts);
                // menu.session.set('cust', response);
                // menu.session.set('pin', response.pin);
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
    var api_endpoint = apiurl + 'getBalance/' + access.code + '/' + access.key + '/' + val;
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

async function postAutoDeposit(val, callback) {
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
            // await postDeposit(val);
            await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
    return true
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
            // await postDeposit(val);
            await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
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
