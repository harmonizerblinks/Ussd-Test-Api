const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};

// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5008/ussd/";

let access = { code: "446785909", key: "164383692" };

menu.sessionConfig({
    start: (sessionId, callback) => {
        // initialize current session if it doesn't exist
        // this is called by menu.run()
        if(!(sessionId in sessions)) sessions[sessionId] = {};
        callback();
    },
    end: (sessionId, callback) => {
        // clear current session
        // this is called by menu.end()
        delete sessions[sessionId];
        callback();
    },
    set: (sessionId, key, value, callback) => {
        // store key-value pair in current session
        sessions[sessionId][key] = value;
        callback();
    },
    get: (sessionId, key, callback) => {
        // retrieve value by key in current session
        let value = sessions[sessionId][key];
        callback(null, value);
    }
});

menu.on('error', (err) => {
    // handle errors
    console.log('Error', err);
    menu.end('error ' + err);
});

// Define menu states
menu.startState({
    run: async() => {
        menu.con('Enter Company Name')
    },
    // next object links to next state based on user input
    next: {
        '*[a-zA-z]+': 'Company.name'
    }
});

menu.state('Start', {
    run: async() => {
        menu.con('Enter Company Name')
    },
    // next object links to next state based on user input
    next: {
        '*[a-zA-z]+': 'Company.name'
    },
    defaultNext: 'Start'
});

///////////////--------------TIER 2 ROUTE STARTS--------------////////////////

menu.state('Company.name', {
    run: () => {
        let company = menu.val;
        menu.session.set('name', company)
        menu.con('How much would you like to pay?')
    },
    next: {
        '*\\d+': 'Tier2.confirm'
    }
})

menu.state('Tier2.confirm', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        var name = await menu.session.get('name');
        menu.con('Please confirm the details below to continue payment:' +
        '\nCompany Name - ' + name +
        '\nAmount - GHS '+ amount + 
        '\n\n0. Make Changes' +
        '\n1. Confirm')
    },
    next: {
        '0': 'Tier2',
        '1': 'Tier2.end'
    }
})

menu.state('Tier2.end', {
    run: async() => {
        var amount = await menu.session.get('amount');
        var name = await menu.session.get('name');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        if (mobile && mobile.startsWith('+233')) {
            // Remove Bearer from string
            mobile = mobile.replace('+233', '0');
        }else if(mobile && mobile.startsWith('233')) {
            // Remove Bearer from string
            mobile = mobile.replace('233', '0');
        }    
        var data = { merchant:access.code,account:name,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Tier 2 payment for ' + name};
        console.log(data) 
        await postDeposit(data, async(result)=> { 
            // menu.end(JSON.stringify(result)); 
        }); 
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')

    }
})



/////////////////------------------USSD SESSION STARTS------------------/////////////////////
// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    menu.run(args, ussdResult => {
        if(args.Operator) {menu.session.set('network', args.Operator); }
        res.send(ussdResult);
    });
    // let args = {
    //     phoneNumber: req.body.phoneNumber,
    //     sessionId: req.body.sessionId,
    //     serviceCode: req.body.serviceCode,
    //     text: req.body.text
    // };
    // await menu.run(args, resMsg => {
    //     res.send(resMsg);
    // });
};


function buyAirtime(phone, val) {
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
            var response = JSON.parse(resp.raw_body);
            // console.log(response);
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
    var api_endpoint = apiurl + 'MomoPayment/' + access.code + '/' + access.key;
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
