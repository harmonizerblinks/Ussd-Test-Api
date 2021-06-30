const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({provider: 'hubtel'});
let sessions = {};
let apiurl = "https://app.alias-solutions.net:5008/ussd/";
let access = { code: "446785909", key: "164383692" };
var unirest = require('unirest');

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


///////////////---------------------PROMO ROUTE STARTS----------------------////////////////
menu.startState({
    run: () => {
        menu.con('Enter Referral Code')
    },
    next: {
        '*\\d+': 'code'
    }
})

menu.state('code', {
    run: async() => {
        let referralcode = menu.val;
        // console.log(1, 'Referral code: ' + referralcode)
        await fetchCustomer(referralcode, async(data) => {
            // console.log(data)
            if(data.active) {     
                await fetchCustomer(menu.args.phoneNumber, async(data) => {
                    // console.log(1, "First Check Done")
                    if(data.active) {     
                        menu.con(`Dear ${data}, you are not registered on Peoples Pensions Trust. Dial *# to register.`)
                    }else{
                        await postCustomer(menu.args.phoneNumber, async(data) => {
                            // console.log(2, "Second Check Done")
                            let name = await menu.session.get('name');  
                            if (data.error) {
                                menu.con('Server Error. Please contact admin.')
                            } else {
                                menu.con('Dear '+ name + ', you have successfully register for the Peoples Pension Trust' + 
                                '\nWould you like to continue with payment?' +
                                '\n0. Exit' +
                                '\n1. Pay')        
                            }
                        })
                    }
                });
            }else{
                menu.con(`Dear Customer, you are not registered on Peoples Pensions Trust. Dial *# to register.`)
            }
        })
    },
    next: {
        '*\\d+': 'pay'
    }
})

menu.state('pay', {
    run: () => {
        menu.con('Choose Option:' +
        '\n1. Daily' +
        '\n2. Weekly'+
        '\n3. Monthly' +
        '\n4. Only once' +
        '\n5. Stop Repeat Payments'
        )
    },
    next: {
        '1': 'policy',
        '2': 'policy',
        '3': 'policy',
        '4': 'policy',
        '5': 'srp'
    }
})

menu.state('policy', {
    run: () => {
        menu.con('Make sure you have enough wallet balance to proceed with transaction of GHS XXX' +
        '\n1. Proceed' +
        '\n0. Exit'
        )
    },
    next: {
        '0': 'policy.exit',
        '1': 'policy.accepted',
    }
})

menu.state('policy.accepted', {
    run: () => {
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
})

menu.state('srp', {
    run: () => {
        menu.end('You have successfully cancelled your Repeat Payments')
    }
})


///////////////---------------------USSD SESSION STARTS----------------------////////////////
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    // console.log(args);
    menu.run(args, ussdResult => {
        menu.session.set('network', args.Operator);
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
            // console.log(resp.body);
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
            // console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
    return true
}
