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
                        menu.con(`Dear ${data.fullname}, you are not registered on Peoples Pensions Trust. Dial *789*7# to register.`)
                    }else{
                        let mobile = menu.args.phoneNumber;
                        if (mobile && mobile.startsWith('+233')) {
                            // Remove Bearer from string
                            mobile = mobile.replace('+233', '0');
                        }else if(mobile && mobile.startsWith('233')) {
                            // Remove Bearer from string
                            mobile = mobile.replace('233', '0');
                        }    
                        await postCustomer(mobile, async(data) => {
                            // console.log(2, "Second Check Done")
                            // let name = await menu.session.get('name');  
                            if (data.error) {
                                menu.con('Server Error. Please contact admin.')
                            } else {
                                menu.con('Dear '+ data.name + ', you have successfully register for the Peoples Pension Trust' + 
                                '\nWould you like to continue with payment?' +
                                '\n0. Exit' +
                                '\n1. Pay')        
                            }
                        })
                    }
                });
            }else{
                menu.con(`Dear Customer, you are not registered on Peoples Pensions Trust. Dial *789*7879# to register.`)
            }
        })
    },
    next: {
        '*\\d+': 'pay'
    }
})

menu.state('pay', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            menu.con('Choose Option:' +
            '\n1. Daily' +
            '\n2. Weekly'+
            '\n3. Monthly' +
            '\n4. Only once')
        })

    },
    next: {
        '4': 'Pay.account',
        '*[0-3]+': 'Pay.view'
    }
})

menu.state('Pay.account', {
    run: async() => {
        var accounts = await menu.session.get('accounts');
        let account = await filterPersonalSchemeOnly(accounts);
        menu.session.set('account', account);
        let amount = await menu.session.get('amount'); 
        menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
        '\n1. Proceed' +
        '\n0. Exit'
        )
    },
    next: {
        '0': 'Exit',
        '1': 'Pay.send',
    }
})

menu.state('Pay.send', {
    run: async () => {
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        // console.log(account);
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+account.code};
        await postDeposit(data, async(result)=> { 
            // menu.end(JSON.stringify(result)); 
        }); 
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
});

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
