const UssdMenu = require('ussd-builder');
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
let apiurlpms = "https://api.alias-solutions.net:8446/api/services/app/Channels/";
let apiurl1 = "https://app.alias-solutions.net:5008/otp/";
let access = { code: "446785909", key: "164383692" };
let chanel = { code: "446785909", key: "164383692" };

// let apiurl = "https://app.alias-solutions.net:5009/ussd/";
// let apiurlpms = "https://api.alias-solutions.net:8442/api/services/app/Channels/";
// let apiurl1 = "https://app.alias-solutions.net:5009/otp/";
// let access = { code: "PPT", key: "178116723" };
// let chanel = { code: "766098501", key: "178116723" };

// POST a User
exports.Register = async(req, res) => {
    var value = req.body;
    console.log(JSON.stringify(value));
    var api_endpoint = apiurl + 'CreateCustomer/' + access.code + '/' + access.key;
    var reqs = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end((resp)=> { 
        if (resp.error) {
            console.log(resp.error)
            console.log(resp.raw_body)
            res.status(500).send({
                message: resp.error
            }); 
        }
        console.log(res.raw_body);
        res.send(res.raw_body);
    });
};

exports.RegisterIcare = async(req, res) => {
    var api_endpoint = apiurl + 'CreateIcare/' + access.code + '/' + access.key;
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                console.log(resp.error);
                // return res;
                res.status(500).send({
                    message: resp.error
                }); 
                // await callback(resp);
            }
            console.log(resp.raw_body);
            
            res.send(res.raw_body);
            // await callback(response);
        });
};

exports.getIcare = (req, res) => {
    console.log('geticare');
    var api_endpoint = apiurl + 'getIcare/' + access.code + '/' + access.key+ '/' + req.user.mobile;
    var req = unirest('GET', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    // .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber }))
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

exports.getIcareAccounts = (req, res) => {
    console.log('geticare');
    var api_endpoint = apiurl + 'getIcare/Accounts/' + access.code + '/' + access.key+ '/' + req.user.mobile;
    console.log(api_endpoint)
    var req = unirest('GET', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    // .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber }))
    .end(function (resp) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(resp.raw_body);
    });
};

exports.getMemberbyNumber = (req, res) => {
    console.log('getinfo');
    var api_endpoint = apiurlpms + 'getMemberProfileByMemberNumber?AppId=' + chanel.code + '&AppKey=' + chanel.key+ '&MemberNumber=' + req.user.id;
    console.log(api_endpoint);
    var req = unirest('GET', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
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

exports.updateMember = async(req, res) => {
    var value = req.body;
    value.appId = chanel.code; value.appKey = chanel.key;
    var api_endpoint = apiurlpms + 'UpdateMemberProfile';
    var reqs = unirest('PUT', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end((resp)=> { 
        if (resp.error) {
            res.status(404).send({
                message: resp.error
            }); 
        }
        // console.log(res.raw_body);
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        res.send(response.result);
    });
};

exports.addBeneficiary = async(req, res) => {
    var value = req.body;
    value.appId = chanel.code; value.appKey = chanel.key;
    var api_endpoint = apiurlpms + 'AddBeneficiary';
    var reqs = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end(function (resp) { 
        if (resp.error) {
            res.status(404).send({
                message: resp.error
            }); 
        }
        // console.log(res.raw_body);
        res.send(res.raw_body);
    });
};

exports.getinfo = (req, res) => {
    console.log('getinfo');
    var api_endpoint = apiurl + 'getInfo/' + access.code + '/' + access.key+ '/' + req.params.mobile;
    console.log()
    var req = unirest('GET', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    // .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber }))
    .end(function (resp) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(resp.raw_body);
    });
};

exports.agentinfo = (req, res) => {
    console.log('agentinfo');
    var api_endpoint = apiurl + 'getInfo/' + access.code + '/' + access.key+ '/' + req.params.mobile;
    console.log(api_endpoint);
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    // .send(JSON.stringify({"appId":appId,"appKey":appKey,"mobile":req.body.schemenumber}))
    .end(function (resp) { 
        if (resp.error) {
            res.status(500).send({
                message: resp.error
            });
            // throw new Error(res.error); 
        }
        // console.log(res.raw_body);
        res.send(resp.raw_body);
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

exports.sendOtp = async(req, res) => {
    var val = req.body;
       
    var api_endpoint = apiurl1 + val.type + '?mobile='+ val.mobile +'&id=' + val.source;
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
       
    var api_endpoint = apiurl1 + 'verify/' + val.otp + '?mobile='+ val.mobile +'&id=' + val.source;
    console.log(api_endpoint);
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
            // if (resp.error) {
            //     console.log(resp.raw_body);
            //     return res.status(500).send({
            //         message: "Error updating user Pin "
            //     });; 
            // }
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

exports.getMember = async(req, res) => {
    var val = req.params.mobile;
    // if (val && val.startsWith('+233')) {
    //     val = val.replace('+233', '0');
    // }else if(val && val.startsWith('233')) {
    //     val = val.replace('233', '0');
    // }
    // if (val && val.startsWith('+')){ val = val.replace('+', ''); } 
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(200).send({ 
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
                success: false, register: false, pin: false
            });
        }
    });
};

exports.getMemberPersonal = async(req, res) => {
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

exports.getScheme = async(req, res) => {
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

exports.getSchemeinfo = async(req, res) => {
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

exports.getMemberinfo = async(req, res) => {
    var val = req.user.mobile;
    // if (val && val.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val = val.replace('+233', '0');
    // }else if(val && val.startsWith('233')) {
    //     // Remove Bearer from string
    //     val = val.replace('233', '0');
    // }
    // if (val && val.startsWith('+')){ val = val.replace('+', ''); } 
    var api_endpoint = apiurl + 'Memberinfo/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            console.log(resp.raw_body);
            res.status(500).send({ 
                success: false, register: false, message: 'User Record not Found' 
            });
        }
        console.log(resp.raw_body);
        // var response = JSON.parse(resp.raw_body);
        // response.pin = null;
        res.send(resp.raw_body);
    });
};

exports.getMemberinfos = async(req, res) => {

    var value = { appId: chanel.code, appKey: chanel.code, mobile: req.user.mobile};
    
    // if (val && val.startsWith('+')){ val = val.replace('+', ''); } 
    var api_endpoint = apiurlpms + 'Memberinfo/';
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .send(JSON.stringify(value))
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'User Record not Found' 
            });
        }
        console.log(resp.body);
        // var response = JSON.parse(resp.raw_body);
        // response.pin = null;
        res.send(resp.body);
    });
};

// Login user
exports.login = (req, res) => {
    var val = req.body.mobile;
    // if (val && val.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val = val.replace('+233', '0');
    // }else if(val && val.startsWith('233')) {
    //     // Remove Bearer from string
    //     val = val.replace('233', '0');
    // }
    // if (val && val.startsWith('+')){ val = val.replace('+', ''); }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, register: false, message: 'Password is not correct' 
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
                    id: data.code,
                    fullname: data.fullname,
                    mobile: data.mobile,
                    email: data.email,
                    scheme: data.accounts[0].code
                },
            }, config.secret, {
                expiresIn: '3h'
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
    var val = req.body;
    console.log(val);
    
    val.appid = access.code; val.appkey = access.key;
    
    console.log(val);

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
                message: "unable to generate statement a the moment pls try again later"
            });
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        // await callback(response);
        res.send(response.payments);
    });
};

exports.getStatement = (req, res) => {
    var val = req.body;
    console.log(val);
    console.log('getstatement');
    var api_endpoint = apiurlpms + 'getStatementBySchemeNumber?AppId=' + chanel.code + '&AppKey=' + chanel.key+ '&SchemeNumber=' + val.schemenumber + '&EndDate=' + val.enddate;
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
    const mobile = req.user.mobile;
    var val = req.body;
    // var method = "";
    if(val.method == "CARD") {
        console.log('getstatement');
        var api_endpoint = apiurl + 'Deposit/Card/'+access.code+'/'+access.key;        
        console.log(api_endpoint);
        var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
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
            res.send({ output: 'Success', message: response.message });
        });
        // res.send({ output: 'Not allowed', message: 'Card Payment still Under Development' });
    } else {
        
        var value = { account:val.account,type:'Deposit',network:val.network,mobile:mobile,amount:val.amount,method:val.method,source:val.source, withdrawal:false, reference:'Deposit to Scheme Number '+val.code, frequency: val.frequency };

        var api_endpoint = apiurl;
        if(val.frequency != "OneTime" && val.network ==="MTN") {
            api_endpoint = apiurl + 'AutoDebit/'+access.code+'/'+access.key;
        } else {
            api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
        }
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
    }
};

exports.Withdrawal = (req, res) => {
    const mobile = req.user.mobile;
    var val = req.body;
    // var method = "";
    var value = { merchant:access.code,account:val.account,type:'Withdrawal',network:val.method,mobile:mobile,amount:val.amount,method:"MOMO",source:val.source, withdrawal:false, reference:'Withdrawal from Scheme Number '+val.account, merchantid:1 };

    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;

    console.log(api_endpoint);
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end( async(resp)=> { 
        if (resp.error) { 
            console.log(resp);
            var respon = JSON.parse(resp.raw_body);
            // if (response.error) throw new Error(response.error);
            return res.status(500).send({
                message: respon.message || "Unable to proccess Payment at the moment"
            });
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        // await callback(response);
        res.send({ output: 'Withdrawal Request Sent', message: response.message });
    });
};

exports.stopAutoDebit = async(req, res) => {
    var value = req.body;
    
    var api_endpoint = apiurl + 'Autodebit/'+access.code+'/'+access.key; 
    var reqs = unirest('DELETE', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(value))
    .end((resp)=> { 
        if (resp.error) {
            res.status(404).send({
                message: resp.error
            }); 
        }
        // console.log(res.raw_body);
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        res.send(response);
    });
};

exports.getOccupations = async(req, res) => {  
    var api_endpoint = apiurlpms + 'GetAllOccupations?AppId=' + chanel.code + '&AppKey=' + chanel.key;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, message: resp.error || 'Unable to Fetch Regions' 
            });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        res.send(response.result);
    });
};

exports.getRegions = async(req, res) => {  
    var api_endpoint = apiurlpms + 'GetAllRegions?AppId=' + chanel.code + '&AppKey=' + chanel.key;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, message: resp.error || 'Unable to Fetch Regions' 
            });
        }
        // console.log(resp.body);
        var response = JSON.parse(resp.raw_body);
        res.send(response.result);
    });
};

exports.getIdType = async(req, res) => {  
    var api_endpoint = apiurlpms + 'GetAllIdTypes?AppId=' + chanel.code + '&AppKey=' + chanel.key;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            console.log(resp.error);
            res.status(500).send({ 
                success: false, message: resp.error || 'Unable to Fetch Regions' 
            });
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        res.send(response.result);
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
                // return res;
                return await callback(resp);
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
            return await callback(response);
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
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                console.log(resp.error);
                // return res;
                return await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            return await callback(response);
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
                // return res;
                return await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            return await callback(response);
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
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
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

            return await callback(response);
        });
}

async function fetchCustomer(val, callback) {
    // try {
        // if (val && val.startsWith('+233')) {
        //     // Remove Bearer from string
        //     val = val.replace('+233', '0');
        // }else if(val && val.startsWith('233')) {
        //     // Remove Bearer from string
        //     val = val.replace('233', '0');
        // }    
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
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

            return await callback(response);
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
            return await callback(resp);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if(response.balance)
        {
            menu.session.set('balance', response.balance);
        }
        
        return await callback(response);
    });
}

async function postAutoDeposit(val, callback) {
    var api_endpoint = apiurl + 'AutoDebit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // console.log(JSON.stringify(val));
        if (resp.error) { 
            // await postDeposit(val);
            return await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        return await callback(response);
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
            // await postDeposit(val);
            return await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        return await callback(response);
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
        return await callback(response);
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
        var response = JSON.parse(resp.raw_body);
        return await callback(response);
    });
    return true
}


async function getCharge(val, callback) {
    var amount = value 
    return true
}
