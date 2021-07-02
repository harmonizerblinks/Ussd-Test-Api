const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/mongodb.config.js');
let sessions = {};
let types = ["", "Current", "Savings", "Susu" ];
// let apiurl = "http://localhost:4000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5000/ussd/";

let access = { code: "ARB", key: "10198553" };
// let access = { code: "ACU001", key: "1029398" };

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
        
        // menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && data.pin != '' && data.pin != null && data.pin != '1234') {     
                menu.con('Welcome to Ahantaman Rural Bank.' + 
                '\nSelect an Option.' + 
                '\n1. Deposit' +
                '\n2. Withdrawal' +
                '\n3. Check Balance' +
                '\n4. Other' +
                '\n5. Contact');
            } else if(data.active && (data.pin == null || data.pin == '' || data.pin == '1234')) {
                menu.con('Welcome to Ahantaman Rural Bank. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.end('Mobile Number not Registered, kindly Open an Account with Ahantaman Rural Bank.');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'Deposit',
        '2': 'Withdrawal',
        '3': 'CheckBalance',
        '4': 'Other',
        '5': 'Contact',
        '*[0-9]+': 'User.newpin'
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && (data.pin != '' || data.pin == null)) {     
                menu.con('Welcome to Ahantaman Rural Bank.' + 
                '\nSelect an Option.' + 
                '\n1. Deposit' +
                '\n2. Withdrawal' +
                '\n3. Check Balance' +
                '\n4. Other' +
                '\n5. Contact');
            } else if(data.active && (data.pin != '' || data.pin == null)) {
                menu.con('Welcome to Ahantaman Rural Bank. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.con('Mobile Number not Registered');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'Deposit',
        '2': 'Withdrawal',
        '3': 'CheckBalance',
        '4': 'Other',
        '5': 'Contact',
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

menu.state('Deposit',{
    run: async() => {
        var accts = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            // console.log(val);
            accts += '\n'+count+'. '+val.code;
            count +=1;
        });
        menu.con('Please Select an Account' + accts)
    },
    next: {
        '#': 'Start',
        '*\\d+': 'Deposit.amount'
    },
    defaultNext: 'Deposit'
})

menu.state('Deposit.amount',{
    run: async() => {
        var index = Number(menu.val);
        var accounts = await menu.session.get('accounts');
        // console.log(accounts);
        var account = accounts[index-1]
        menu.session.set('account', account);
        menu.con('How much would you like to pay to ' +account.type+ ' account number '+account.code+'?')
    },
    next: {
        '*\\d+': 'Deposit.view',
    },
    defaultNext: 'Deposit.amount'
})

menu.state('Deposit.view',{
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        var cust = await menu.session.get('cust');
        // console.log(cust);
        if(amount > 10000) {
            menu.con('Invalid Amount Provided. Enter (0) to continue.');
        } else {
            menu.con(cust.fullname +', you are making a deposit of GHS '+amount+' into your account'+
            '\n1. Confirm' +
            '\n2. Cancel' +
            '\n#. Main Menu');
        }
    },
    next: {
        '0': 'Start',
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
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Account Number '+account.code +' from mobile number '+mobile,merchantid:account.merchantid };
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

menu.state('Withdrawal',{
    run: () => {
        menu.con('Enter your PIN to make a Withdrawal');
    },
    next: {
        '*\\d+': 'Withdrawal.account'
    }
})

menu.state('Withdrawal.account',{
    run: async() => {
        var pin = await menu.session.get('pin');
        // var custpin = Number(menu.val);
        console.info(pin, menu.val);
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
        '*\\d+': 'Withdrawal.amount'
    },
    defaultNext: 'Withdrawal'
})

menu.state('Withdrawal.amount',{
    run: async() => {
        var index = Number(menu.val);
        var accounts = await menu.session.get('accounts');
        // console.log(accounts);
        var account = accounts[index-1]
        // menu.session.set('account', account);
        await fetchBalance(account.code, async(result)=> { 
            console.log(result) 
            if(result.balance > 0 && result.balance != null) {
                account.balance = result.balance;
                menu.session.set('account', account);
                menu.session.set('balance', result.balance);
                menu.con('How much would you like to withdraw from account number '+account.code+'?');
            } else {
                menu.end('Error Retrieving current Account Balance, please try again');
            }
        });
        // menu.con('How much would you like to withdraw from account number '+account.code+'?');
    },
    next: {
        '*\\d+': 'Withdrawal.view',
    },
    defaultNext: 'Withdrawal.amount'
})

menu.state('Withdrawal.view',{
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        if(amount < 1) { menu.end("Minimum Withdrawal Amount is 1 cedis") }
        menu.session.set('amount', amount);
        var cust = await menu.session.get('cust');
        var account = await menu.session.get('account');
        var balance = await menu.session.get('balance');
        var charge = await amount * (1/100);
        // console.log(cust);
        if(balance >= (amount + charge)) {
            menu.con(cust.fullname +', you are making a withdrawal of GHS ' +(amount+charge) +' from your '+account.type+' account' +
            '\n1. Confirm' +
            '\n2. Cancel' +
            '\n#. Main Menu');
        } else {
            menu.end('Insufficent Account Balance.');
        }
    },
    next: {
        '0': 'Start',
        '#': 'Start',
        '1': 'Withdrawal.confirm',
        '2': 'Withdrawal.cancel',
    },
    defaultNext: 'Withdrawal.amount'
});

menu.state('Withdrawal.confirm', {
    run: async() => {
        // access user input value save in session
        //var cust = await menu.session.get('cust');
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Withdrawal',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:true, reference:'Withdrawal from Account Number '+account.code  +' from mobile number '+mobile,merchantid:account.merchantid };
        await postWithdrawal(data, async(result)=> { 
            console.log(result) 
            // menu.end(JSON.stringify(result)); 
            menu.end(result.message);
        });
        // menu.end('Payment request of amount GHC ' + amount + ' sent to your phone.');
    }
});

menu.state('Withdrawal.cancel', {
    run: () => {
        // Cancel Withdrawal request
        menu.end('Thank you for using People Pension Trust.');
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
            if(result.balance != null) { 
                account.balance = result.balance; 
                menu.session.set('account', account);
                menu.con('Your '+account.type+' balance is GHS '+ result.balance+ '\nEnter zero(0) to continue');
            } else {
                menu.con('Your '+account.type+' balance is GHS '+ result.balance+ '\nEnter zero(0) to continue');
            }
        });
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'CheckBalance.amount'
});

menu.state('Other',{
    run: () => {
        menu.con('1. Change Pin' + '\n2. Open Account' + '\n3. Mini Satement')
    },
    next: {
        '1': 'User.account',
        '2': 'Account',
        '3': 'Statement',
    }
});

menu.state('Account',{
    run: () => {
        menu.con('Please contact Ahantaman Rural Bank on +233(0)312091033 for assistance with account opening. Thank you' +	
        '\n\n0.	Return to Main Menu')
    },
    next: {
        '0': 'Start'
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
        '*\\d+': 'Statement.transactions'
    },
    defaultNext: 'Statement'
})

menu.state('Statement.transactions',{
    run: async() => {
        var index = Number(menu.val);
        var accounts = await menu.session.get('accounts');
        // console.log(accounts);
        var account = accounts[index-1]
        // menu.session.set('account', account);
        await fetchStatement(account.code, async(data)=> { 
            console.log(data)
            var accts = ''; var count = 1;
            await data.forEach(async(val) => {
                // console.log(val);
                accts += '\n'+count+'. '+ new Date(val.date).toLocaleDateString() +' '+val.type.toUpperCase() + '- GHC ' +val.amount;
                count +=1;
            });
            menu.con('Transaction Details' + accts)
        });
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'Statement.amount'
});


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
    console.log(args);
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
        var api_endpoint = apiurl + 'getCustomer/' + access.code+'/'+access.key + '/' + val;
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
    var api_endpoint = apiurl + 'getBalance/' + access.code +'/' + val;
    console.log(api_endpoint);
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
    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
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
