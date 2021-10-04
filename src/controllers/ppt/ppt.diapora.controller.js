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
    code: "ACU001",
    key: "1029398",
    apiurl: ""
}];

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
                success: false, register: false, error: resp.body 
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

// Post Payment
exports.Deposit = (req, res) => {
    const mobile = req.user.mobile;
    var val = req.body;
    // var method = "";
    if(val.method == "CARD") {
        console.log('postcard');
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

function getkey(code) {
    return accesses.find((ele) => ele.code === code);
}

async function getCharge(val, callback) {
    var amount = value 
    return true
}
