const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};
let optionArray = ["", "DAILY", "WEEKLY", "MONTHLY"];

// Test Credentials
// let apiurl = "https://app.alias-solutions.net:5008/ussd/";
// let access = { code: "446785909", key: "164383692" };

// Live Credentials
let apiurl = "https://app.alias-solutions.net:5009/ussd/";
let access = { code: "PPT", key: "178116723" };

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


///////////////---------------------MENU ROUTE STARTS----------------------////////////////
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
        await fetchOfficer(referralcode, async(data) => {
            if(data.active) {     
                menu.con('Dear Customer, please confirm Referrer\'s Details: ' + '\n' + data.name + '\n\n1. Confirm \n0. Back')
            }else{
                menu.end('Dear Customer, your referral code is invalid.')
            }
        })
    },
    next: {
        '1': 'Confirm.officer',
        '0': '__start__'
    }
})

menu.state('Confirm.officer', {
    run: async() => {
        await fetchCustomer(menu.args.phoneNumber, async(data) => {
            menu.session.set('cust', data);
            if(data.active) {     
                menu.con(`Dear ${data.fullname}, How much would you like to pay?`)
            }else{
                let mobile = menu.args.phoneNumber;
                menu.session.set('mobile', mobile);        
                await getInfo(mobile, async(data) =>{
                    // console.log(data)
                    // if(data){
                        var firstname = data.firstname;
                        var lastname = data.lastname;
                        menu.session.set('firstname', firstname)
                        menu.session.set('lastname', lastname)
                        menu.con('Please confirm Person\'s details:' +
                        '\nFirst Name: ' + firstname +
                        '\nLast Name: ' + lastname +
                        
                        '\n\n#. Make Changes' +
                        '\n0. Confirm');
                    // } else {
                        
                    // }
                }, 
                async (error) => {
                    menu.end('Sorry could not retrieve customer details')
                })  
            }
        });
    },
    next: {
        '#': 'Register.change',
        '0': 'Register.complete',
        '*\\d+': 'pay',
    }
})

menu.state('Register.change', {
    run: () => {
        menu.con('Please enter Person\'s first name')
    },
    next: {
        '*[a-zA-Z]+': 'Register.firstname'
    }
});

menu.state('Register.firstname', {
    run: () => {
        let firstname = menu.val;
        menu.session.set('firstname', firstname);
        menu.con('Please enter Person\'s last name')
    },
    next: {
        '*[a-zA-Z]+': 'Register.lastname'
    }
})

menu.state('Register.lastname', {
    run: async() => {
        let lastname = menu.val;
        menu.session.set('lastname', lastname);    
        var firstname = await menu.session.get('firstname');
        var mobile = menu.args.phoneNumber;
        // if (mobile && mobile.startsWith('+233')) {
        //     // Remove Bearer from string
        //     mobile = mobile.replace('+233', '0');
        // }else if(mobile && mobile.startsWith('233')) {
        //     // Remove Bearer from string
        //     mobile = mobile.replace('233', '0');
        // }    
        menu.con('Please confirm the registration details below to continue:' +
        '\nFirst Name - ' + firstname +
        '\nLast Name - '+ lastname + 
        '\nMobile Number - '+ mobile +
        '\n\n0. Make Changes' +
        '\n1. Confirm')
    },
    next: {
        '*\\d+': 'Register.complete'
    }
})

menu.state('Register.complete', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var officer = await menu.session.get('officer');
        var mobile = menu.args.phoneNumber;
        // if (mobile && mobile.startsWith('+233')) {
        //     // Remove Bearer from string
        //     mobile = mobile.replace('+233', '0');
        // }else if(mobile && mobile.startsWith('233')) {
        //     // Remove Bearer from string
        //     mobile = mobile.replace('233', '0');
        // }    
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, email: "N/A", gender: 'N/A', source: "USSD", referer_code: officer.code
        };
        await postCustomer(data, (dat) => {
            if(dat.schemenumber) {
                // menu.session.set('cust', data)
                menu.con('Dear '+ data.firstname + ', you have successfully registered for the People\'s Pension Trust' + 
                '\nHow much would you like to pay?');
            } else {
                menu.end(dat.message || 'Dear Customer, the number you entered is already registered.');
            }
        })

    },
    next: {
        '*\\d+': 'pay'
    }
})

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using People\'s Pension Trust');
    }
})



menu.state('pay', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        menu.con('Choose Option:' +
        '\n1. Daily' +
        '\n2. Weekly'+
        '\n3. Monthly' +
        '\n4. One time' + 
        '\n5. Stop Repeat Payment')
    },
    next: {
        '4': 'Pay.account',
        '5': 'Srp',
        '*[1-3]+': 'Pay.view'
    }
})

menu.state('Pay.account', {
    run: async() => {
        await filterPersonalSchemeOnly(menu.args.phoneNumber, async (data) => {
            if (data.active){
                menu.session.set('account', data.accounts);
                let amount = await menu.session.get('amount'); 
                menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
                '\n1. Proceed' +
                '\n0. Exit'
                )
            }else{
                menu.end('Dear Customer, you do not have a Personal Pension Scheme signup on www.peoplespension.global')
            }
        });
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
        var officer = await menu.session.get('officer');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+account.code, officerid: officer.officerid};
        await postDeposit(data, async(result)=> { 
            // menu.end(JSON.stringify(result)); 
        },
        async(error)=> {
            console.log(error)
            // menu.end('Sorry could not process transaction, please retry later')
        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
});

menu.state('Pay.view', {
    run: async() => {
        let index = Number(menu.val);
        let option = optionArray[index];
        menu.session.set('paymentoption', option);

        await filterPersonalSchemeOnly(menu.args.phoneNumber, async (data) => {
            if (data.active){
                menu.session.set('account', data.accounts);
                let amount = await menu.session.get('amount'); 
                menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} on ${option.toLowerCase()} basis` +
                '\n1. Proceed' +
                '\n0. Exit'
                )
            }else{
                menu.end('Dear Customer, you do not have a Personal Pension Scheme signup on www.peoplespension.global')
            }
        });
    },
    next: {
        '1': 'Pay.view.AutoDebit',
        '0': 'Exit'
    }
});


menu.state('Pay.view.AutoDebit', {
    run: async() => {        
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var paymentoption = await menu.session.get('paymentoption');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code, frequency: paymentoption, type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+account.schemenumber,merchantid:account.merchantid};

        await postAutoDeposit(data, async(data) => {
            console.log(error);
            // menu.end('Request submitted successfully. You will receive a payment prompt shortly')
        },async(error) => {
            console.log(error);
            // menu.end('Sorry could not process transaction, please retry later')
        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
});

menu.state('Srp', {
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
        // if(args.Operator){ menu.session.set('network', args.Operator); }
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
    // if (val && val.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val = val.replace('+233', '0');
    // }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp.body);
            }
            // console.log(resp.body);
            // var response = JSON.parse(resp.raw_body);
            
            return await callback(resp.body);
            
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
                // return res;
                return await callback(resp.body);
            }
            // console.log(resp.body);
            // var response = JSON.parse(resp.raw_body);
            return await callback(resp.body);
        });
    return true
}

async function fetchOfficer(val, callback) {
    // try {
        // if (val && val.startsWith('+233')) {
        //     // Remove Bearer from string
        //     val = val.replace('+233','0');
        // }
        var api_endpoint = apiurl + 'getOfficer/' + access.code + '/'+ access.key + '/'+ val;
        // console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            if (resp.error) { 
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
            }
            var response = JSON.parse(resp.raw_body);
            if(response.active)
            {
                menu.session.set('officer', response);
                // menu.session.set('limit', response.result.limit);
            }
            
            return await callback(response);
        });
}

async function filterPersonalSchemeOnly(val, callback) {
    var api_endpoint = apiurl + 'getCustomer/Personal/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp.body);
            }
            return await callback(resp.body);
        });
}

async function postDeposit(val, callback,errorCallback ) {
    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // console.log(JSON.stringify(val));
        if (resp.error) { 
            return await errorCallback(resp.body);
        }
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        return await callback(response);
    });
    return true
}

async function getInfo(val, callback,errorCallback) {
    var api_endpoint = apiurl + 'getInfo/' + access.code + '/' + access.key + '/' + val;
    var req = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                // return res;
                // await callback(resp);
                return await errorCallback(resp.body);
            }
            else
            {
                // var response = JSON.parse(resp.raw_body);
                return await callback(resp.body);
            }
        });
    return true
}

async function postAutoDeposit(val, callback,errorCallback) {
    var api_endpoint = apiurl + 'AutoDebit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        if (resp.error) { 
            return await errorCallback(resp.body);
        }
        else
        {
            // if (res.error) throw new Error(res.error); 
            // var response = JSON.parse(resp.raw_body);
            return await callback(resp.body);
        }
    });
}
