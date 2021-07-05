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
    menu.end(err);
});

// Define menu states
menu.startState({
    run: async() => {
        // Fetch Customer information
        
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active) {     
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
        '1': 'Pay',
        '2': 'Icare',
        '3': 'CheckBalance',
        '4': 'Withdrawal',
        '5': 'Contact',
        '*[0-9]+': 'User.newpin'
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active) {     
                menu.con('Welcome to Peoples Pensions Trust' + 
                '\n1. Pay' +
                '\n2. iCare (Pay for Someone)' +
                '\n3. Check Balance' +
                '\n4. Withdrawal' +
                '\n5. Contact us'
                )
            }else{
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
            var newpin = Number(menu.val);
            menu.session.set('newpin', newpin);
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
            var mobile = await menu.session.get('mobile');
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
        var mobile = menu.args.phoneNumber;
        let name = await menu.session.get('name');  
        if (mobile && mobile.startsWith('+233')) {
            mobile = mobile.replace('+233', '0');
        } else if (mobile && mobile.startsWith('233')) {
            mobile = mobile.replace('233', '0');
        }
        var data = {
            fullname: name, mobile: mobile, gender: gender, email: "peoplespensiontrust@gmail.com", type: 'Pension', source: "USSD"
        };

        await postCustomer(data, (data) => {
            // console.log(data.body);
            if (data.status === 400) {
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
        '0': 'Exit',
        '1': 'Register.pay',
    }
});

menu.state('Exit', {
    run: () => {
        menu.end('')
    }
})


///////////////--------------PAY ROUTE STARTS--------------////////////////
menu.state('Pay', {
    run: async() => {
        let name = await menu.session.get('name');
        menu.con(`Dear ${name}, How much would you like to pay?`)
    },
    next: {
        '*\\d+': 'Pay.amount'
    }
})

menu.state('Pay.amount', {
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
        '4': 'Pay.account',
        '5': 'Srp',
        '*[0-3]+': 'Pay.auto'
    }
})

menu.state('Pay.account', {
    run: async() => {
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.code;
            count += 1;
        });
        menu.con('Please select Preferred Scheme Number: ' + schemes)
    },
    next: {
        '*\\d+': 'Pay.view',
    }
});

menu.state('Pay.auto', {
    run: async() => {
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.code;
            count += 1;
        });
        menu.con('Please select Preferred Scheme Number: ' + schemes)
    },
    next: {
        '*\\d+': 'Pay.view',
    }
})

menu.state('Pay.view', {
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
        '0': 'Exit',
        '1': 'Pay.send',
    }
})

menu.state('Pay.send', {
    run: async () => {
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+account.code,merchantid:account.merchantid };
        // console.log(data);
        await postDeposit(data, async(data) => {
            if (data.status == 0) {
                menu.end('Request submitted successfully. You will receive a payment prompt shortly');
            } else {
                menu.end('Application Server error. Please contact administrator');
            }
        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
});

menu.state('Srp', {
    run: () => {
        menu.end('You have successfully cancelled your Repeat Payments')
    }
});

///////////////--------------ICARE ROUTE STARTS--------------////////////////

menu.state('Icare', {
    run: () => {
        menu.con('Choose Preferred Option:' +
        '\n1. Register for Someone' +
        '\n2. Pay for Someone')
    },
    next: {
        '1': 'Icare.register',
        '2': 'Icare.mobile',
    }
});

menu.state('Icare.register', {
    run: () => {
        menu.con('Please enter Person\'s mobile number')
    },
    next: {
        '*\\d+': 'Icare.next'
    }
});

menu.state('Icare.next', {
    run: async() => {
        var network = await menu.session.get('network');
        let mobile = menu.val;
        menu.session.set('mobile', mobile);        
        var data = {
            type: "Info", appId: access.code, appKey: access.key, mobile: mobile, network: network
        }
        await getInfo(data, async(data) =>{
            var name = data.firstname;
            var nameArray = name.split(" ")
            // console.log(nameArray.length)
            if (nameArray.length > 2){
                menu.session.set('firstname', capitalizeFirstLetter(nameArray[0]))
                menu.session.set('lastname', capitalizeFirstLetter(nameArray[2]))
            }else{
                menu.session.set('firstname', capitalizeFirstLetter(nameArray[0]))
                menu.session.set('lastname', capitalizeFirstLetter(nameArray[1]))
            }

            menu.con(`Please confirm Person\'s details:
            First Name: ${await menu.session.get('firstname')}
            Last Name: ${await menu.session.get('lastname')}
            
            0. Make Changes
            1. Confirm`)
        })
    },
    next: {
        '0': 'Icare.change',
        '1': 'Icare.lastname',
    }
});

menu.state('Icare.change', {
    run: () => {
        menu.con('Please enter Person\'s first name')
    },
    next: {
        '*[a-zA-Z]+': 'Icare.firstname'
    }
});

menu.state('Icare.firstname', {
    run: () => {
        let firstname = menu.val;
        menu.session.set('firstname', firstname);
        menu.con('Please enter Person\'s last name')
    },
    next: {
        '*[a-zA-Z]+': 'Icare.lastname'
    }
})

menu.state('Icare.lastname', {
    run: () => {
        let lastname = menu.val;
        menu.session.set('lastname', lastname);
        menu.con('Select Person\'s gender:' +
            '\n1. Male' +
            '\n2. Female'
        )
    },
    next: {
        '*\\d+': 'Icare.gender'
    }
})

menu.state('Icare.gender', {
    run: async() => {
        var index = Number(menu.val);
        if (index > 2) {
            menu.con('Incorrect Selection. Enter zero(0) to retry again')
        } else {
            var gender = genderArray[index]
            menu.session.set('gender', gender);
            var firstname = await menu.session.get('firstname');
            var lastname = await menu.session.get('lastname');
            var gender = await menu.session.get('gender');
            var mobile = await menu.session.get('mobile');
            if (mobile && mobile.startsWith('+233')) {
                // Remove Bearer from string
                mobile = mobile.replace('+233', '0');
            }    
            menu.con('Please confirm the registration details below to continue:' +
            '\nFirst Name - ' + firstname +
            '\nLast Name - '+ lastname + 
            '\nMobile Number - '+ mobile +
            '\nGender: ' + gender +
            '\n\n0. Make Changes' +
            '\n1. Confirm')
            }
    },
    next: {
        '0': 'Icare.register',
        '1': 'Icare.complete',
    },
    defaultNext: 'Icare.gender'
})

menu.state('Icare.complete', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        // var name = await menu.session.get('name');
        var gender = await menu.session.get('gender');
        var mobile = await menu.session.get('mobile');
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, gender: gender, email: "alias@gmail.com", source: "USSD"
        };
        await postCustomer(data, (data) => {
            if(data.active) {
                menu.con('Your account has been created successfully. Press 1 to continue payment');
            } else {
                menu.con('Dear Customer, the number you entered is already registered. Press 0 to continue to the Main Menu');
            }
        })

    },
    next: {
        '0': 'exit',
        '1': 'Icare.mobile',
    }
})

menu.state('exit', {
    run: () => {
        menu.end('')
    }
})

menu.state('Icare.mobile', {
    run: () => {
        menu.con('Enter Mobile Number of Person')
    },
    next: {
        '*\\d+': 'Icare.pay'
    }
})

menu.state('Deposit', {
    run: async() => {
        await fetchCustomer(menu.val, (data)=> { 
            // console.log(1,data);  
            if(data.active) {
                menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else {
                menu.con('Mobile Number not Registered. Enter (0) to Continue');
            }
        });
    },
    next: {
        '0': 'Start',
        '*\\d+': 'Deposit.account'
    },
    defaultNext: 'Deposit.account'
});

menu.state('Deposit.account', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.code;
            count += 1;
        });
        menu.con('Please select Preferred Scheme Number: ' + schemes)
    },
    next: {
        '*\\d+': 'Deposit.view',
    }
});

menu.state('Deposit.view', {
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
        '0': 'Exit',
        '1': 'Deposit.send',
    }
})

menu.state('Deposit.send', {
    run: async() => {
        // access user input value save in session
        var of = await menu.session.get('officer');
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD',withdrawal:false,reference:'Deposit', officerid: of.officerid, merchantid:account.merchantid };
        await postDeposit(data, async(result)=> { 
            // console.log(result) 
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
});

menu.state('Deposit.cancel', {
    run: () => {
        // Cancel Deposit request
        menu.end('Thank you for using People Pension Trust.');
    }
});

menu.state('Srp', {
    run: () => {
        menu.end('You have successfully cancelled your Repeat Payments')
    }
});



///////////////--------------CHECK BALANCE ROUTE STARTS--------------////////////////

menu.state('CheckBalance',{
    run: async() => {
        var pin = await menu.session.get('pin');
        // var custpin = Number(menu.val);
        // if(menu.val === pin) {
            var accts = ''; var count = 1;
            var accounts = await menu.session.get('accounts');
            accounts.forEach(val => {
                // console.log(val);
                accts += '\n'+count+'. '+val.code;
                count +=1;
            });
            menu.con('Please select Preferred Scheme Number: ' + accts)
        // } else {
        //     menu.con('Incorrect Pin. Enter zero(0) to continue')
        // }
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
            menu.con('Your '+account.type+' Total Contribution is GHS '+ result.contribution+ '\nSaving is GHS '+result.savings +'.\nEnter zero(0) to continue');
        });
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'CheckBalance.amount'
});

///////////////--------------WITHDRAWAL ROUTE STARTS--------------////////////////

menu.state('Withdrawal',{
    run: async() => {
        // var custpin = Number(menu.val);
        console.info(pin, menu.val);
        var accts = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            accts += '\n'+count+'. '+val.code;
            count +=1;
        });
        menu.con('Please select Preferred Scheme Number: ' + accts)
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
                account.balance = result.contribution;
                menu.session.set('account', account);
                menu.session.set('balance', result.savings);
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
            menu.con(cust.fullname +', you are making a Withdrawal Request of GHS ' + amount +' from your '+account.type+' account' +
            '\n1. Confirm' +
            '\n2. Cancel' +
            '\n#. Main Menu');
        } else {
            menu.con('Not Enough Savings in Account. Enter zero(0) to continue')
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
        var data = { merchant:access.code,account:account.code,type:'Withdrawal',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:true, reference:'Withdrawal from Scheme Number '+account.code,merchantid:account.merchantid };
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

/////////////////------------------CONTACT US STARTS------------------/////////////////////
menu.state('Contact', {
    run: () => {
        menu.con('1. Stop Repeat Payment' +
        '\n2. Name' +
        '\n3. Email' +
        '\n4. Mobile' +
        '\n5. Website');
    },
    next: {
        '1': 'Srp',
        '2': 'Contact.name',
        '3': 'Contact.email',
        '4': 'Contact.mobile',
        '5': 'Contact.website'
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
        menu.end('info@peoplepension.global.');
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
        menu.end('http://www.peoplespension.global');
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
    console.log(1 ,api_endpoint);
    console.log(2 ,val);
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async(resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                console.log(resp.error);
                // return res;
                await callback(resp);
            }
            console.log(resp.raw_body);
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
    return true
}

async function getInfo(val, callback) {
    var api_endpoint = apiurl + 'MobileInfo';
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
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
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
                console.log(resp.error);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
    return true
}

async function fetchIcareCustomer(val, callback) {
    // try {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }
    var api_endpoint = apiurl + 'getIcare/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
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
            // console.log(resp.raw_body);
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
    var api_endpoint = apiurl + 'getBalance/' + access.code + '/' + access.key + '/' + val;
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
            // await postDeposit(val);
            await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        console.log(resp.raw_body);
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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }