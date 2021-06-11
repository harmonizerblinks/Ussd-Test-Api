const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
let types = ["", "Current", "Savings", "Susu" ];
// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api-maximus.paynowafrica.com/ussd/";
// let apiurl = "http://godfreddavidson-002-site25.ftempurl.com/ussd/";
let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";

let access = { code: "test", key: "VWJ1bnR1IENhcGl0YWwgTWljci4gTHRk" };

menu.sessionConfig({
    start: (sessionId, callback) => {
        // initialize current session if it doesn't exist
        // this is called by menu.run()
        if (!(sessionId in sessions)) sessions[sessionId] = {};
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
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && data.pin != '') {     
                menu.con('Welcome to GPRTU Collections.' + 
                '\nSelect an Option.' + 
                '\n1. Make Payment' + 
                '\n2. Check Balance'+ 
                '\n3. Other');
            } else if(data.active && (data.pin ==null || data.pin == '')) {
                menu.con('Welcome to GPRTU Collections. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.end('Mobile Number not Registered');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'Deposit',
        '2': 'CheckBalance',
        '3': 'Other',
        '4': 'Contact',
        '*[0-9]+': 'User.newpin'
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && data.pin != '') {     
                menu.con('Welcome to GPRTU Collections.' + 
                '\nSelect an Option.' + 
                '\n1. Make Payment' + 
                '\n2. Check Balance'+ 
                '\n3. Other');
            } else if(data.active && (data.pin ==null || data.pin == '')) {
                menu.con('Welcome to GPRTU Collections. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.end('Mobile Number not Registered');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'Deposit',
        '2': 'CheckBalance',
        '3': 'Other',
        '4': 'Contact',
        '*[0-9]+': 'User.newpin'
    },
    defaultNext: 'Start'
});


menu.state('User.account',{
    run: () => {
        menu.con('Enter your current 4 digits PIN')
    },
    next: {
        '*\\d+': 'User.pin'
    }
});

menu.state('User.pin',{
    run: async() => {
        var pin = await menu.session.get('pin');
        if(menu.val === pin) {
            // var newpin = Number(menu.val);
            // menu.session.set('newpin', newpin);
            menu.con('Enter new 4 digits PIN');
        } else {
            menu.end('Incorrect Pin. Enter zero(0) to continue');
        }
    },
    next: {
        '0': 'Start',
        '*\\d+': 'User.newpin'
    },
    defaultNext: 'Start'
});

menu.state('User.newpin',{
    run: () => {
        if(menu.val.length == 4) {
            var newpin = menu.val;
            menu.session.set('newpin', newpin);
            menu.con('Re-enter the 4 digits');
        } else {
            menu.end('Pin must be 4 digits');
        }
    },
    next: {
        '*\\d+': 'User.verifypin'
    },
    defaultNext: 'Start'
})

menu.state('User.verifypin', {
    run: async() => {
        var pin = await menu.session.get('newpin');
        if(menu.val === pin) {
            var newpin = Number(menu.val);
            // var cust = await menu.session.get('cust');
            // console.log(cust);
            // var cus = JSON.parse(cust);
            var mobile = await menu.session.get('mobile');
            // menu.con('Thank you for successfully creating a PIN. Enter zero(0) to continue');
            var value = { type: 'Customer', mobile: mobile, pin: pin, newpin: newpin, confirmpin: newpin };
            await postChangePin(value, (data)=> { 
                // console.log(1,data); 
                menu.session.set('pin', newpin);
                menu.con(data.message);
            });
        } else {
            menu.con('Incorrect Pin. Enter zero(0) to continue')
        }
    },
    next: {
        '0': 'Start'
    },
    defaultNext: 'Start'
});

menu.state('Deposit', {
    run: async() => {
        
        var index = 1;
        var accounts = await menu.session.get('accounts');
        var account = accounts[index-1]
        menu.session.set('account', account);
        var amount = 3;
        menu.session.set('amount', amount);
        var cust = await menu.session.get('cust');
        
        menu.con(cust.fullname +', you are making a payment of GHS ' + amount +' into your account' +
        '\n1. Confirm' +
        '\n2. Cancel' +
        '\n#. Main Menu')
    },
    next: {
        '#': 'Start',
        '1': 'Deposit.confirm',
        '2': 'Deposit.cancel',
    },
    defaultNext: 'Deposit.amount'
});

menu.state('Deposit.confirm', {
    run: async() => {
        // access user input value save in session
        //var cust = await menu.session.get('cust');
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit',merchantid:account.merchantid };
        await postDeposit(data, async(result)=> { 
            // console.log(result) 
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone.');
    }
});

menu.state('Deposit.cancel', {
    run: () => {
        // Cancel Deposit request
        menu.end('Thank you for using Ahantaman Rural Bank.');
    }
});

menu.state('CheckBalance',{
    run: () => {
        menu.con('Enter your PIN to check balance');
    },
    next: {
        '*\\d+': 'CheckBalance.account'
    },
    defaultNext: 'CheckBalance'
});

menu.state('CheckBalance.account',{
    run: async() => {
        var pin = await menu.session.get('pin');
        // var custpin = Number(menu.val);
        if(menu.val === pin) {
            var accts = ''; var count = 1;
            var accounts = await menu.session.get('accounts');
            accounts.forEach(val => {
                // console.log(val);
                accts += '\n'+count+'. '+val.code;
                count +=1;
            });
            menu.con('Please Select an Account' + accts)
        } else {
            menu.con('Incorrect Pin. Enter zero(0) to continue')
        }
    },
    next: {
        '0': 'Start',
        '*\\d+': 'CheckBalance.balance'
    },
    defaultNext: 'CheckBalance'
})

menu.state('CheckBalance.balance',{
    run: async() => {
        var index = Number(menu.val);
        var accounts = await menu.session.get('accounts');
        // console.log(accounts);
        var account = accounts[index-1]
        // menu.session.set('account', account);
        await fetchBalance(account.code, async(result)=> { 
            console.log(result) 
            if(result.balance != null) { account.balance = result.balance; }
            menu.session.set('account', account);
            menu.session.set('balance', result.balance);
            menu.con('Your '+account.type+' balance is GHS '+ account.balance+ '\nEnter zero(0) to continue');
        });
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'CheckBalance.amount'
});

menu.state('Other',{
    run: () => {
        menu.con('1. Change Pin' + '\n2. Mini Satement')
    },
    next: {
        '1': 'User.account',
        '2': 'Statement',
    }
});


menu.state('Statement',{
    run: () => {
        menu.con('Enter your PIN to check Account Mini statement');
    },
    next: {
        '*\\d+': 'Statement.account'
    },
    defaultNext: 'Statement'
});

menu.state('Statement.account',{
    run: async() => {
        var pin = await menu.session.get('pin');
        // var custpin = Number(menu.val);
        if(menu.val === pin) {
            var accts = ''; var count = 1;
            var accounts = await menu.session.get('accounts');
            var account = accounts[index-1]
            await fetchStatement(account.code, async(data)=> { 
                console.log(data)
                var accts = ''; var count = 1;
                await data.forEach(async(val) => {
                    // console.log(val);
                    accts += '\n'+count+'. '+ new Date(val.date).toLocaleDateString() +' '+val.type.toUpperCase() + '- GHC ' +val.amount;
                    count +=1;
                });
                menu.con('Payment Details' + accts)
            });
        } else {
            menu.con('Incorrect Pin. Enter zero(0) to continue')
        }
    },
    next: {
        '0': 'Start'
    },
    defaultNext: 'Statement'
})


menu.state('Contact', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('1. Stop auto-debit' +
            '\n2. Name' +
            '\n3. Email' +
            '\n4. Mobile' +
            '\n5. Website');
    },
    // next object links to next state based on user input
    next: {
        '1': 'AutoDebit',
        '2': 'Contact.name',
        '3': 'Contact.email',
        '4': 'Contact.mobile',
        '5': 'Contact.website'
    }
});

menu.state('AutoDebit', {
    run: () => {
        // Cancel Savings request
        menu.end('Auto Debit disabled successfully.');
    }
});

menu.state('Contact.name', {
    run: () => {
        // Cancel Savings request
        menu.end('Ahantaman Rural Bank Limited.');
    }
});

menu.state('Contact.email', {
    run: () => {
        // Cancel Savings request
        menu.end('info@ahantamanbank.com.gh.');
    }
});

menu.state('Contact.mobile', {
    run: () => {
        // Contact Mobile
        menu.end('+233 (0) 31 209 1033');
    }
});

menu.state('Contact.website', {
    run: () => {
        // Contact Website
        menu.end('http://www.ahantamanbank.com.gh');
    }
});


// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
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


function buyAirtime(phone, val) {
    return true
}

async function fetchCustomer(val, callback) {
    // try {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233','0');
        }
        var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + val;
        console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            if (resp.error) { 
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if(response.active)
            {
                menu.session.set('name', response.name);
                menu.session.set('mobile', val);
                menu.session.set('accounts', response.accounts);
                menu.session.set('cust', response);
                menu.session.set('type', response.type);
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

async function fetchStatement(val, callback) {
    var api_endpoint = apiurl + 'getAccountTransaction/' + access.code + '/'+ access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error);
            await callback(resp);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        
        await callback(response);
    });
}

async function postDeposit(val, callback) {
    var api_endpoint = apiurl + 'Deposit/' + access.code;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        console.log(JSON.stringify(val));
        if (resp.error) { 
            console.log(resp.error);
            await postDeposit(val);
            await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
    return true
}

async function postWithdrawal(val, callback) {
    var api_endpoint = apiurl + 'Withdrawal/' + access.code;
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
    var api_endpoint = apiurl + 'Change/' + access.code;
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