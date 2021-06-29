const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};
// let types = ["", "Current", "Savings", "Susu"];
// let maritalArray = ["", "Single", "Married", "Divorced", "Widow", "Widower", "Private"];
let genderArray = ["", "Male", "Female"]

// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5008/ussd/";

// let access = { code: "ARB", key: "10198553" };
let access = { code: "ACU001", key: "1029398" };

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
                menu.con('Welcome to Peoples Pensions Trust' + 
                '\n1. Pay' +
                '\n2. iCare (Pay for Someone)' +
                '\n3. Check Balance' +
                '\n4. Withdrawal' +
                '\n5. Contact us'
                )
        } else if(data.active && (data.pin == null || data.pin == '' || data.pin == '1234')) {
                menu.con('Welcome to Peoples Pensions Trust. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.con('Welcome to Peoples Pensions Trust, kindly follow the steps to Onboard \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Register',
        '1': 'pay',
        '2': 'icare',
        '3': 'checkbalance',
        '4': 'withdrawal',
        '5': 'contactus',
        '*[0-9]+': 'pin'
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active && data.pin != '' && data.pin != null && data.pin != '1234') {     
                menu.con('Welcome to Peoples Pensions Trust' + 
                '\n1. Pay' +
                '\n2. iCare (Pay for Someone)' +
                '\n3. Check Balance' +
                '\n4. Withdrawal' +
                '\n5. Contact us'
                )
        } else if(data.active && (data.pin == null || data.pin == '' || data.pin == '1234')) {
                menu.con('Welcome to Peoples Pensions Trust. Please create a PIN before continuing' + '\nEnter 4 digits.')
            } else {
                menu.con('Welcome to Peoples Pensions Trust, kindly follow the steps to Onboard \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Register',
        '1': 'Deposit',
        '2': 'Withdrawal',
        '3': 'CheckBalance',
        '4': 'Other',
        '5': 'Contact',
        '*[0-9]+': 'User.newpin'
    },
    defaultNext: 'Start'
});


menu.state('pin',{
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

menu.state('Register', {
    run: () => {
        menu.con('Enter your full name')
    },
    next: {
        '*[a-zA-Z]+': 'Register.name'
    }
});

menu.state('Register.name', {
    run: () => {
        let name = menu.val;
        menu.session.set('name', name);
        menu.con('Select your gender:' +
            '\n1. Male' +
            '\n2. Female')
    },
    next: {
        '*\\d+': 'Register.gender'
    }
});

menu.state('Register.gender', {
    run: async() => {
        var index = Number(menu.val);
        var gender = genderArray[index]
        menu.session.set('gender', gender);

        let name = await menu.session.get('name');  

        await postCustomer(menu.args.phoneNumber, (data) => {
            // console.log(data);
            if (!data) {
                menu.con('Server Error. Please contact admin.')
            } else {
                menu.con('Dear '+ name + ', you have successfully register for the Peoples Pension Trust' + 
                '\nWould you like to continue with payment?' +
                '\n0. Exit' +
                '\n1. Pay')        
            }
        });  
    },
    next: {
        '0': 'exit',
        '1': 'register.pay',
    }
});

menu.state('exit', {
    run: () => {
        menu.end('')
    }
})


///////////////--------------PAY ROUTE STARTS--------------////////////////
menu.state('pay', {
    run: async() => {
        let name = await menu.session.get('name');
        menu.con(`Dear ${name}, How much would you like to pay?`)
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

///////////////--------------ICARE ROUTE STARTS--------------////////////////

menu.state('icare', {
    run: () => {
        menu.con('Choose Preferred Option:' +
        '\n1. Register for Someone' +
        '\n2. Pay for Someone')
    },
    next: {
        '1': 'icare.register',
        '2': 'icare.phonenumber',
    }
});

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
        '0': 'exit',
        '1': 'icare.phonenumber',
    }
})

menu.state('exit', {
    run: () => {
        menu.end('')
    }
})

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


///////////////--------------CHECK BALANCE ROUTE STARTS--------------////////////////

menu.state('checkbalance',{
    run: () => {
        menu.con('Enter your PIN to check balance');
    },
    next: {
        '*\\d+': 'CheckBalance.account'
    },
    defaultNext: 'checkbalance'
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
            menu.con('Please select Preferred Scheme Number: ' + accts)
        } else {
            menu.con('Incorrect Pin. Enter zero(0) to continue')
        }
    },
    next: {
        '0': 'Start',
        '*\\d+': 'CheckBalance.balance'
    },
    defaultNext: 'checkbalance'
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
            menu.con('Your '+account.type+' balance is GHS '+ result.balance+ '\nEnter zero(0) to continue');
        });
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'CheckBalance.amount'
});

///////////////--------------WITHDRAWAL ROUTE STARTS--------------////////////////

menu.state('withdrawal',{
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
            menu.con('Please select Preferred Scheme Number: ' + accts)
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
        menu.session.set('account', account);
        await fetchBalance(account.code, async(result)=> { 
            // console.log(result) 
            if(result.balance > 0) {
                account.balance = result.balance;
                menu.session.set('account', account);
                menu.session.set('balance', result.balance);
                menu.con('How much would you like to withdraw from account number '+account.code+'?');
            } else {
                menu.con('Error Retrieving Account Balance with '+account.code+', please try again');
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
        // var balance = await menu.session.get('account');
        // console.log(cust);
        if(account.balance >= amount) {
            menu.con(cust.fullname +', you are making a withdrawal of GHS ' + amount +' from your '+account.type+' account' +
            '\n1. Confirm' +
            '\n2. Cancel' +
            '\n#. Main Menu');
        } else {
            menu.con('Not Enough Fund in Account. Enter zero(0) to continue')
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
        var data = { merchant:access.code,account:account.code,type:'Withdrawal',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:true, reference:'Withdrawal from Account Number '+account.code,merchantid:account.merchantid };
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

///////////////--------------TIER 2 ROUTE STARTS--------------////////////////

menu.state('tier2', {
    run: () => {
        menu.con('Enter Company Name')
    },
    next: {
        '*[a-zA-z]+': 'company.name'
    }
})

menu.state('company.name', {
    run: () => {
        let company = menu.val;
        menu.session.set('companyname', company)
        menu.con('How much would you like to pay?')
    },
    next: {
        '*\\d+': 'tier2.confirm'
    }
})

menu.state('tier2.confirm', {
    run: async() => {
        let tier2amount = menu.val;
        menu.session.set('amount', tier2amount);
        var amount = await menu.session.get('amount');
        var companyname = await menu.session.get('companyname');
        menu.con('Please confirm the details below to continue payment:' +
        '\nCompany Name - ' + companyname +
        '\nAmount - GHS '+ amount + 
        '\n\n0. Make Changes' +
        '\n1. Confirm')
    },
    next: {
        '0': 'tier2',
        '1': 'tier2.end'
    }
})

menu.state('tier2.end', {
    run: async() => {
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Account Number '+account.code,merchantid:account.merchantid };
        await postDeposit(data, async(data) => {
                if (data) {
                    menu.end('Request submitted successfully. You will receive a payment prompt shortly');
                } else {
                    menu.end('Application Server error. Please contact administrator');
                }
        });
    }
})

///////////////--------------TRIMESTER ROUTE STARTS--------------////////////////
menu.state('trimestersave', {
    run: () => {
        menu.con('Choose Option' +
        '\n1. Pay')
    },
    next: {
        '1': 'trimester.pay'
    }
})

menu.state('trimester.pay', {
    run: () => {
        menu.con('Enter Customer\'s Mobile Number')
    },
    next: {
        '*\\d+': 'customernumber'
    }
})

menu.state('customernumber', {
    run: async() => {
       //  Receive input from menu and verify from API
       var phonenumber = menu.val;
       await fetchCustomer(phonenumber, (data)=> { 
            // console.log(1,data); 
            if(data.active) {     
                menu.con(`Dear ${data.fullname}, You are already registered. How much would you like to pay?`)
            }else {
                menu.con(`Dear ${data.fullname}, Your registration is successful. How much would you like to pay?`)
            }
        });
    },
    next: {
        '*\\d+': 'customernumber.pay'
    }
})

menu.state('customernumber.pay', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount)
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.type + ' A/C';
            count += 1;
        });
        menu.con('Please select Preferred Scheme Number: ' + schemes)
    },
    next: {
        '1': 'policy.customernumber.proceed',
        '2': 'policy.customernumber.proceed',
        '3': 'policy.customernumber.proceed',
    }
})

menu.state('policy.customernumber.proceed', {
    run: async() => {
        var amount = await menu.session.get('amount')
        menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount}` +
        '\n1. Proceed' +
        '\n0. Exit'
        )
    },
    next: {
        '0': 'policy.exit',
        '1': 'policy.customernumber.accepted',
    }
})

menu.state('policy.customernumber.accepted', {
    run: async() => {
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Account Number '+account.code,merchantid:account.merchantid };
        await postDeposit(data, async(data) => {
                if (data) {
                    menu.end('Request submitted successfully. You will receive a payment prompt shortly');
                } else {
                    menu.end('Application Server error. Please contact administrator');
                }
        });
    }
})



/////////////////------------------CONTACT US STARTS------------------/////////////////////
menu.state('contactus', {
    run: () => {
        menu.con('1. Name' +
        '\n2. Email' +
        '\n3. Mobile' +
        '\n4. Website');
    },
    next: {
        '1': 'Contact.name',
        '2': 'Contact.email',
        '3': 'Contact.mobile',
        '4': 'Contact.website'
    }
})

menu.state('Contact.name', {
    run: () => {
        // Cancel Savings request
        menu.end('People Pension Trust.');
    }
});

menu.state('Contact.email', {
    run: () => {
        // Cancel Savings request
        menu.end('info@peoplespensiontrust.com.');
    }
});

menu.state('Contact.mobile', {
    run: () => {
        // Cancel Savings request
        menu.end('0302738242');
    }
});

menu.state('Contact.website', {
    run: () => {
        // Cancel Savings request
        menu.end('http://www.peoplespensiontrust.com');
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
            // console.log(resp.body);
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
