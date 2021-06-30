const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};
let types = ["", "Current", "Savings", "Susu"];
let maritalArray = ["", "Single", "Married", "Divorced", "Widow", "Widower", "Private"];
let genderArray = ["", "Male", "Female"]

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
        // Fetch Customer information
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && data.pin != '' && data.pin != null && data.pin != '1234') {     
                menu.con('Welcome to Peoples Pensions Trust. Choose Preferred Option:' +
                '\n1. Register for Someone' +
                '\n2. Pay for Someone'
                )
            }else if(data.active && (data.pin == null || data.pin == '' || data.pin == '1234')) {
                menu.con('Welcome to Peoples Pensions Trust. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.con('Welcome to Peoples Pensions Trust, kindly follow the steps to Onboard \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'icare.register',
        '2': 'icare.phonenumber',
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && data.pin != '' && data.pin != null && data.pin != '1234') {     
                menu.con('Welcome to Peoples Pensions Trust. Choose Preferred Option:' +
                '\n1. Register for Someone' +
                '\n2. Pay for Someone'
                )
            }else if(data.active && (data.pin == null || data.pin == '' || data.pin == '1234')) {
                menu.con('Welcome to Peoples Pensions Trust. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.con('Welcome to Peoples Pensions Trust, kindly follow the steps to Onboard \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'icare.register',
        '2': 'icare.phonenumber',
    },
    defaultNext: 'Start'
});


///////////////--------------ICARE > REGISTER ROUTE STARTS--------------////////////////

menu.state('icare.register', {
    run: () => {
        menu.con('Please enter Person\'s first name')
    },
    next: {
        '*[a-zA-Z]+': 'register.firstname'
    }
});

menu.state('register.firstname', {
    run: () => {
        let firstname = menu.val;
        menu.session.set('icarefirstname', firstname);
        menu.con('Please enter Person\'s last name')
    },
    next: {
        '*[a-zA-Z]+': 'register.gender'
    }
})

menu.state('register.gender', {
    run: () => {
        let lastname = menu.val;
        menu.session.set('icarelastname', lastname);
        menu.con('Select Person\'s gender:' +
            '\n1. Male' +
            '\n2. Female'
        )
    },
    next: {
        '*\\d+': 'register.phonenumber'
    }
})

menu.state('register.phonenumber', {
    run: () => {
        var index = Number(menu.val);
        if (index > 2) {
            menu.con('Incorrect Pin. Enter zero(0) to retry again')
        } else {
            var gender = genderArray[index]
            menu.session.set('gender', gender);
            menu.con('Enter Mobile Number of Person')  
        }
    },
    next: {
        '0': 'icare.register',
        '*\\d+': 'register.confirm'
    },
    defaultNext: 'register.gender'
})

menu.state('register.confirm', {
    run: async() => {
        let phonenumber = menu.val;
        menu.session.set('icaremobile', phonenumber);        
        var Firstname = await menu.session.get('icarefirstname');
        var Lastname = await menu.session.get('icarelastname');
        var gender = await menu.session.get('gender');
        var Mobile = await menu.session.get('icaremobile');
        menu.con('Please confirm the registration details below to continue:' +
        '\nFirst Name - ' + Firstname +
        '\nLast Name - '+ Lastname + 
        '\nMobile Number - '+ Mobile +
        '\nGender: ' + gender +
        '\n\n0. Make Changes' +
        '\n1. Confirm')
    },
    next: {
        '0': 'icare.register',
        '1': 'register.pay',
    }
});

menu.state('register.pay', {
    run: async() => {
        var name = await menu.session.get('icarefirstname') + ' ' + await menu.session.get('icarelastname');
        menu.session.set('icarename', name);

        var name = await menu.session.get('icarename');
        var gender = await menu.session.get('gender');
        var mobile = await menu.session.get('icaremobile');
        if (mobile && mobile.startsWith('+233')) {
            // Remove Bearer from string
            mobile = mobile.replace('+233', '0');
        }
        var data = {
            fullname: name, mobile: mobile, gender: gender, email: "alias@gmail.com", source: "USSD"
        };
        await postCustomer(data, (data) => {
            if(data.active) {
                menu.con('Your account has been created successfully. Press 0 to continue to the Main Menu');
            } else {
                menu.end(data.message);
            }
        })

    },
    next: {
        '0': 'Start',
    }
})

menu.state('exit', {
    run: () => {
        menu.end('')
    }
})

///////////////--------------ICARE > PAY ROUTE STARTS--------------////////////////

menu.state('icare.phonenumber', {
    run: () => {
        menu.con('Enter Mobile Number of Person')
    },
    next: {
        '*\\d+': 'icare.pay'
    }
})

menu.state('icare.pay', {
    run: async() => {
        let phonenumber = menu.val;
        menu.session.set('icaremobile', phonenumber);
        let name = await menu.session.get('icarename');
        menu.con(`Enter amount to pay for ${name}`)
    },
    next: {
        '*\\d+': 'pay.amount'
    }
})

menu.state('pay.amount', {
    run: () => {
        let amount = menu.val;
        menu.session.set('amount', amount);

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
    run: async() => {
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.type + ' A/C';
            count += 1;
        });
        menu.con('Please select Preferred Scheme Number: ' + schemes)
    },
    next: {
        '1': 'policy.proceed',
        '2': 'policy.proceed',
        '3': 'policy.proceed',
    }
})

menu.state('policy.proceed', {
    run: async() => {
        var index = Number(menu.val);
        var accounts = await menu.session.get('accounts');
        // console.log(accounts);
        var account = accounts[index-1]
        menu.session.set('account', account);

        let amount = await menu.session.get('amount'); 
        menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
        '\n1. Proceed' +
        '\n0. Exit'
        )
    },
    next: {
        '0': 'policy',
        '1': 'policy.accepted',
    }
})

menu.state('policy.accepted', {
    run: async () => {
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Account Number '+account.code,merchantid:account.merchantid };
        await postDeposit(data, async(data) => {
                if (data.status) {
                    menu.end('Request submitted successfully. You will receive a payment prompt shortly');
                } else {
                    menu.end('Application Server error. Please contact administrator');
                }
            });
        }
});

menu.state('srp', {
    run: () => {
        menu.end('You have successfully cancelled your Repeat Payments')
    }
});


/////////////////------------------USSD SESSION STARTS------------------/////////////////////
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

async function getCharge(val, callback) {
    var amount = value 
    return true
}
