const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config/mongodb.config.js');
let types = ["", "Current", "Savings", "Susu" ];
// let apiurl = "http://localhost:4000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5003/ussd/";

let access = { code: "L005", key: "546787787" };
// let access = { code: "ACU001", key: "1029398" };

let sessions = {};
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
        console.log(sessions[sessionId], 'Deleted');
        delete sessions[sessionId];
        callback();
    },
    set: (sessionId, key, value, callback) => {
        // store key-value pair in current session
        sessions[sessionId][key] = value;
        // console.log(sessions[sessionId]);
        // console.log(key, value, 'Saved');
        callback();
    },
    get: (sessionId, key, callback) => {
        // retrieve value by key in current session
        let value = sessions[sessionId][key];
        // console.log(key, value, 'Get');
        // console.log(sessions[sessionId]);
        callback(null, value);
    }
});


menu.on('error', (err) => {
    // handle errors
    console.log('Error', err);
    menu.end(err);
});

// Define menu states
menu.startState({
    run: async() => {
        // Fetch Customer information
        console.log(menu.args,'Argument');
        
        // menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. We apologise for any inconvenience.');
        // menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            console.log(1,data); 
            if(data && data.active && data.pin != '' && data.pin != null && data.pin != '1234') {
                menu.session.set('cust', data);
                menu.session.set('pin', data.pin);

                menu.con('Welcome to Leverage Micro Finance.' + 
                '\nSelect an Option.' + 
                '\n1. Deposit' +
                '\n2. Withdrawal' +
                '\n3. Check Balance' +
                '\n4. Other' +
                '\n5. Contact');

            } else if(data && data.active && (data.pin == null || data.pin == '' || data.pin == '1234')) {
                menu.session.set('cust', data);
                // menu.session.set('pin', data.pin);

                menu.con('Welcome to Leverage Micro Finance. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.end('Mobile Number not Registered, kindly Open an Account with Leverage Micro Finance.');
            }
        }).catch((err)=>{ menu.end(err); });
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
                menu.session.set('cust', data);
                // menu.session.set('mobile', data.mobile);
                menu.session.set('pin', data.pin);
                menu.con('Welcome to Leverage Micro Finance.' + 
                '\nSelect an Option.' + 
                '\n1. Deposit' +
                '\n2. Withdrawal' +
                '\n3. Check Balance' +
                '\n4. Other' +
                '\n5. Contact');
            } else if(data.active && (data.pin != '' || data.pin == null)) {
                menu.session.set('cust', data);
                menu.con('Welcome to Leverage Micro Finance. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.con('Mobile Number not Registered');
            }
        }).catch((err)=>{ menu.end(err); });
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
            var mobile = menu.args.phoneNumber;
            // menu.con('Thank you for successfully creating a PIN. Enter zero(0) to continue');
            var value = { type: 'Customer', mobile: mobile, pin: pin, newpin: newpin, confirmpin: newpin };
            await postChangePin(value, (data)=> { 
                // console.log(1,data); 
                menu.session.set('pin', newpin);
                menu.con(data.message);
            }).catch((err)=>{ menu.end(err); });;
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
        var cust = menu.session.get('cust');
        console.log(cust);
        await fetchCustomerAccounts(menu.args.phoneNumber, (accounts)=> { 
            if(accounts.length > 0) {
                var accts = ''; var count = 1;
                // menu.session.set('accounts',accounts);
                // var accounts = await menu.session.get('accounts');
                accounts.forEach(val => {
                    // console.log(val);
                    accts += '\n'+count+'. '+val.code;
                    count +=1;
                });
                menu.con('Please Select an Account' + accts);
            } else {
                menu.end('Unable to Fetch Accounts, please try again');
            }
        }).catch((err)=>{ menu.end(err); });;
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
        // var cust = await menu.session.get('accounts');
        // // console.log(accounts);
        // var account = cust.accounts[index-1]
        // menu.session.set('account', account);
        // menu.con('How much would you like to pay to ' +account.type+ ' account number '+account.code+'?');
        var val = {mobile: menu.args.phoneNumber, index: index};
        await fetchCustomerAccount(val, (account)=> { 
            // console.log(account);
            if(account && account.code) {
                menu.session.set('account',account);
                
                menu.con('How much would you like to pay to ' +account.type+ ' account number '+account.code+'?');
            } else {
                menu.end('Unable to Fetch Selected Account, please try again');
            }
        });
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
        var account = await menu.session.get('account');
        // console.log(cust);
        if(amount > 10000) {
            menu.end('Invalid Amount Provided. Please try again.');
        } else {
            await fetchCustomer(menu.args.phoneNumber, (data)=> { 
                if(data.active) {
                    menu.session.set('cust', data);
                    menu.con(data.fullname +', you are making a deposit of GHS '+amount+' into your ' +account.type+ ' ACCOUNT'+
                    '\n1. Confirm' +
                    '\n2. Cancel' +
                    '\n#. Main Menu');
                }
                menu.end('An error occur, kindly try again');
            });
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
        // var cust = await menu.session.get('cust');
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        // var network = await menu.session.get('network');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        // var mobile = cust.mobile;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD',withdrawal:false, reference:'Deposit to Account Number '+account.code +' from mobile number '+mobile,merchantid:account.merchantid };
        console.log('posting Payment');
        await postDeposit(data, async(result)=> { 
            console.log(result) 
            // menu.end(result.message); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone.');
    },
    next: {
        '0': 'Start'
    }
});

menu.state('Deposit.cancel', {
    run: () => {
        // Cancel Deposit request
        menu.end('Thank you for using Leverage Micro Finance.');
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
            // var accts = ''; var count = 1;
            // var accounts = await menu.session.get('accounts');
            // accounts.forEach(val => {
            //     // console.log(val);
            //     accts += '\n'+count+'. '+val.code;
            //     count +=1;
            // });
            // menu.con('Please Select an Account' + accts)
            await fetchCustomerAccounts(menu.args.phoneNumber, (accounts)=> { 
                if(accounts.length > 0) {
                    var accts = ''; var count = 1;
                    // menu.session.set('accounts',accounts);
                    // var accounts = await menu.session.get('accounts');
                    accounts.forEach(val => {
                        // console.log(val);
                        accts += '\n'+count+'. '+val.code;
                        count +=1;
                    });
                    menu.con('Please Select an Account' + accts);
                } else {
                    menu.end('Unable to Fetch Bank Accounts, please try again');
                }
            });
        } else {
            menu.end('Incorrect Pin. Pls Try again')
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
        var val = {mobile: menu.args.phoneNumber, index: index};
        await fetchCustomerAccount(val, async(account)=> { 
            console.log(account);
            if(account && account.code) {
                menu.session.set('account',account);
                await fetchBalance(account.code, async(result)=> { 
                    // console.log(result) 
                    if(result.balance > 0 && result.balance != null) {
                        // account.balance = result.balance;
                        // menu.session.set('account', account);
                        menu.session.set('balance', result.balance);
                        menu.con('How much would you like to withdraw from account number '+account.code+'?');
                    } else {
                        menu.end('Error Retrieving Selected Account Balance, please try again');
                    }
                });
            } else {
                menu.end('Unable to Fetch Selected Account, please try again');
            }
        });
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
        // var cust = await menu.session.get('cust');
        var account = await menu.session.get('account');
        var balance = await menu.session.get('balance');
        var charge = 0.1;
        // console.log(cust);
        if(balance >= (amount + charge)) {
            await fetchCustomer(menu.args.phoneNumber, (data)=> { 
                if(data.active) {
                    menu.session.set('cust', data);
                    menu.con(data.fullname +', you are making a withdrawal of GHS ' +(amount+charge) +' from your '+account.type+' account' +
                    '\n1. Confirm' +
                    '\n2. Cancel' +
                    '\n#. Main Menu');
                } else {
                    menu.end('An error occur, kindly try again');
                }
            });
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
        var network = menu.args.operator;
        // var mobile = await menu.session.get('mobile');
        var val = menu.args.phoneNumber;
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233','0');
            // if (val != mobile) menu.end("Unable to proccess Withdrawal at the moment. Please try again");
        }
        var data = { merchant:access.code,account:account.code,type:'Withdrawal',network:network,mobile:val,amount:amount,method:'MOMO',source:'USSD', withdrawal:true, reference:'Withdrawal from Account Number '+account.code  +' to mobile number '+val,merchantid:account.merchantid };
        await postWithdrawal(data, async(result)=> { 
            console.log(result);
            // menu.end(JSON.stringify(result)); 
            menu.end(result.message);
        }).catch((err)=>{
            menu.end(err)
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
    // defaultNext: 'CheckBalance'
});

menu.state('CheckBalance.account',{
    run: async() => {
        var pin = await menu.session.get('pin');
        // var custpin = Number(menu.val);
        console.log(pin);
        if(menu.val === pin) {
            await fetchCustomerAccounts(menu.args.phoneNumber, (accounts)=> { 
                if(accounts.length > 0) {
                    var accts = ''; var count = 1;
                    // menu.session.set('accounts',accounts);
                    // var accounts = await menu.session.get('accounts');
                    accounts.forEach(val => {
                        // console.log(val);
                        accts += '\n'+count+'. '+val.code;
                        count +=1;
                    });
                    menu.con('Please Select an Account' + accts);
                } else {
                    menu.end('Unable to Fetch Bank Accounts, please try again');
                }
            }).catch((err)=>{
                menu.end(err)
            });
        } else {
            menu.con('Incorrect Pin. Enter zero(0) to continue')
        }
    },
    next: {
        '0': 'Start',
        '*\\d+': 'CheckBalance.balance'
    },
    // defaultNext: 'CheckBalance'
})

menu.state('CheckBalance.balance',{
    run: async() => {
        var index = Number(menu.val);
        var val = {mobile: menu.args.phoneNumber, index: index};
        console.log(val);
        await fetchCustomerAccount(val, async(account)=> { 
            console.log(account);
            if(account && account.code) {
                await fetchBalance(account.code, async(result)=> { 
                    // console.log(result) 
                    if(result.balance != null) { 
                        menu.con('Your '+account.type+' balance is GHS '+ result.balance+ '\nEnter zero(0) to continue');
                    } else {
                        menu.con('Your '+account.type+' balance is GHS '+ account.balance+ '\nEnter zero(0) to continue');
                    }
                });
            } else {
                menu.end('Unable to Fetch Selected Account, please try again');
            }
        }).catch((err)=>{
            menu.end(err)
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
        menu.con('Please contact Leverage Micro Finance on +233(0)312091033 for assistance with account opening. Thank you' +	
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
            await fetchCustomerAccounts(menu.args.phoneNumber, (accounts)=> { 
                if(accounts.length > 0) {
                    var accts = ''; var count = 1;
                    menu.session.set('accounts',accounts);
                    // var accounts = await menu.session.get('accounts');
                    accounts.forEach(val => {
                        // console.log(val);
                        accts += '\n'+count+'. '+val.code;
                        count +=1;
                    });
                    menu.con('Please Select an Account' + accts);
                } else {
                    menu.end('Unable to Fetch Bank Accounts, please try again');
                }
            }).catch((err)=>{
                menu.end(err)
            });
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
        menu.end('Leverage Micro Finance Limited.');
    }
});

menu.state('Contact.email', {
    run: () => {
        // Cancel Savings request
        menu.end('info@leveragefinance.com');
    }
});

menu.state('Contact.mobile', {
    run: () => {
        // Contact Mobile
        menu.end('+233 (0)303 933 698');
    }
});

menu.state('Contact.website', {
    run: () => {
        // Contact Website
        menu.end('www.leveragemicrofinancelimited.com');
    }
});


// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    // if (args.Type == 'initiation') {
    //     args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    // }
    // console.log(args);
    // let resp = await menu.run(args)
    // res.send(resp);
    await menu.run(req.body, ussdResult => {
        // menu.session.set('network', args.Operator);
        res.send(ussdResult);
    });
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
            // console.log(resp.error);
            // var response = JSON.parse(res);
            // return res;
            await callback(resp.error);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        // if(response.active)
        // {
        //     menu.session.set('limit', response.result.limit);
        // }
        
        await callback(response);
    });
}


async function fetchCustomerAccounts(val, callback) {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233','0');
        }
        var api_endpoint = apiurl + 'getCustomerAccounts/' + access.code+'/'+access.key + '/' + val;
        console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            if (resp.error) { 
                // console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            
            await callback(response);
        });
}

async function fetchCustomerAccount(val, callback) {
    if (val.mobile && val.mobile.startsWith('+233')) {
        // Remove Bearer from string
        val.mobile = val.mobile.replace('+233','0');
    }
    var api_endpoint = apiurl + 'getCustomerAccount/' + access.code+'/'+access.key + '/' + val.mobile+ '/' + val.index;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            // console.log(resp.error);
            // var response = JSON.parse(res);
            // return res;
            await callback(resp);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        
        await callback(response);
    });
}

async function fetchBalance(val, callback) {
    var api_endpoint = apiurl + 'getBalance/' + access.code +'/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            // console.log(resp.error);
            await callback(resp.error);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        // if(response.balance)
        // {
        //     menu.session.set('balance', response.balance);
        // }
        
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
    if (val.mobile && val.mobile.startsWith('+233')) {
        // Remove Bearer from string
        val.mobile = val.mobile.replace('+233','0');
    }
    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        console.log(JSON.stringify(val));
        if (resp.error) { 
            // console.log(resp.error);
            // await postDeposit(val);
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
    if (val.mobile && val.mobile.startsWith('+233')) {
        // Remove Bearer from string
        val.mobile = val.mobile.replace('+233','0');
    }
    var api_endpoint = apiurl + 'Withdrawal/' + access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        if (resp.error) { 
            // console.log(resp.error);
            await callback(resp.error);
        }
        // if (res.error) throw new Error(res.error); 
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
    return true
}

async function postChangePin(val, callback) {
    if (val.mobile && val.mobile.startsWith('+233')) {
        // Remove Bearer from string
        val.mobile = val.mobile.replace('+233','0');
    }
    var api_endpoint = apiurl + 'Change/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error);
            // await postDeposit(val);
            await callback(resp);
        }
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
