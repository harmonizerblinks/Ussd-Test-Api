const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
// let types = ["", "Current", "Savings", "Susu"];
// let maritalArray = ["", "Single", "Married", "Private", "Divorced", "Widow", "Widower", "Private"];
let genderArray = ["", "Male", "Female"];
let policyArray = [undefined, 1, 2, 3, 4];

// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5003/ussd/";

// let access = { code: "ARB", key: "10198553" };
let access = { code: "ACU001", key: "1029398" };

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
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active) {     
                menu.con('Dear '+ data.fullname +', Welcome to Boafo Pa Plus.' + 
                '\nSelect an Option.' + 
                '\n1. Payment' +
                '\n2. Check Status' +
                '\n4. Claims' +
                '\n5. Agent');
            } else {
                menu.con('Welcome to Boafo Pa Plus. Press (0) zero to register \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Register',
        '1': 'Payment',
        '2': 'Withdrawal',
        '3': 'CheckStatus',
        '4': 'Claims',
        '5': 'Agent',
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            if(data.active) {     
                menu.con('Dear '+ data.fullname +', Welcome to Boafo Pa Plus.' + 
                '\nSelect an Option.' + 
                '\n1. Payment' +
                '\n2. Check Status' +
                '\n4. Claims' +
                '\n5. Agent');
            } else {
                menu.con('Welcome to Boafo Pa Plus. Press (0) zero to register \n0. Register');
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
        '0': 'Register',
        '*[0-9]+': 'User.newpin'
    },
    defaultNext: 'Start'
});

menu.state('Register', {
    run: async() => {
        let mobile = menu.args.phoneNumber;
        // console.log(mobile)
        menu.session.set('mobile', mobile);        
        await getInfo(mobile, async(data) =>{
            console.log(data.body)
            if(data.lastname && data.lastname == null){
                var name = data.firstname;
                var nameArray = name.split(" ")
                var firstname = capitalizeFirstLetter(nameArray[0]);
                var lastname = capitalizeFirstLetter(nameArray[1]);
                menu.session.set('firstname', firstname)
                menu.session.set('lastname', lastname)

            }else{
                var firstname = data.firstname;
                var lastname = data.lastname;
                menu.session.set('firstname', firstname)
                menu.session.set('lastname', lastname)
            }
            menu.con('Please confirm Person\'s details:' +
            '\nFirst Name: ' + firstname +
            '\nLast Name: ' + lastname +
            
            '\n\n0. Make Changes' +
            '\n1. Continue')
        })
    },
    next: {
        '0': 'Register.change',
        '1': 'Register.Auto.Gender',
    }
});

menu.state('Register.Auto.Gender', {
    run: () => {
        menu.con('Please choose an option for your gender:' +
        '\n1. Male' +
        '\n2. Female') 
},
    next: {
        '*\\d+': 'Policy',
    }
});

menu.state('Policy',{
    run: async() => {
        if(menu.val > 2){
            menu.con('Invalid option. Press (0) zero to try again.')
        }else{
            let gender = genderArray[Number(menu.val)];
            menu.session.set('gender', gender);
            menu.con('Select Policy Type:' +
            '\n1. Standard' +
            '\n2. Bronze' +
            '\n3. Silver' +
            '\n4. Gold' +
            '\n5. Diamond')    
        }
    },
    next: {
        '*\\d+': 'Policy.Type'
    },
    defaultNext: 'Register.Auto.Gender'
})

menu.state('Policy.Type',{
    run: async() => {
        menu.con('Select Payment Plan:' +
        '\n1. Daily' +
        '\n2. Weekly' +
        '\n3. Monthly')
    },
    next: {
        '*\\d+': 'Policy.Option'
    }
})

menu.state('Policy.Option',{
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var fullname = firstname+' '+lastname;
        menu.con('Dear '+ fullname +', please confirm your registration for the Gold policy with a weekly plan of GHS '+ policyamount +
        '\n1. Confirm' +
        '\n2. Cancel')
    },
    next: {
        '1': 'Policy.option',
        '2': 'Exit'
    }
})

menu.state('Register.Auto.Complete', {
    run: async() => {
            var firstname = await menu.session.get('firstname');
            var lastname = await menu.session.get('lastname');
            var gender = await menu.session.get('gender');
            var mobile = await menu.session.get('mobile');
            if (mobile && mobile.startsWith('+233')) {
                // Remove Bearer from string
                mobile = mobile.replace('+233', '0');
            }else if(mobile && mobile.startsWith('233')) {
                // Remove Bearer from string
                mobile = mobile.replace('233', '0');
            }            
            var data = {
                fullname: firstname+' '+lastname, mobile: mobile, email: "alias@gmail.com", gender: gender, source: "USSD"
            };
            // await postCustomer(data, (data) => {
            //     if (data.active) {
                    menu.con('Your account has been registered successfully. Press (0) zero to continue to Main Menu..')
                // }else{
                //     menu.end(data.message || 'Registration not Successful')
                // }
            // })
    },
    next: {
        '0': 'Start'
    }
});

//////////////////////////////////////////////////////////////////////////////////////

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
            menu.con('Please choose an option for your gender:' +
            '\n1. Male' +
            '\n2. Female') 
    },
    next: {
        '*\\d+': 'Register.gender',
    }
})

menu.state('Register.gender', {
    run: async() => {
            if(menu.val > 2){
                menu.con('Invalid option. Press (0) zero to try again.')
            }else{
                let gender = genderArray[Number(menu.val)];
                menu.session.set('gender', gender);
                var firstname = await menu.session.get('firstname');
                var mobile = await menu.session.get('mobile');
                if (mobile && mobile.startsWith('+233')) {
                    // Remove Bearer from string
                    mobile = mobile.replace('+233', '0');
                }else if(mobile && mobile.startsWith('233')) {
                    // Remove Bearer from string
                    mobile = mobile.replace('233', '0');
                }    
                menu.con('Please confirm the registration details below to continue:' +
                '\nFirst Name - ' + firstname +
                '\nLast Name - '+ lastname + 
                '\nMobile Number - '+ mobile +
                '\n\n0. Make Changes' +
                '\n1. Confirm')
            }
    },
    next: {
        '0': 'Register.register',
        '1': 'Register.complete',
    },
    defaultNext: 'Registration.lastname'
})

menu.state('Register.complete', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var gender = await menu.session.get('gender');
        var mobile = await menu.session.get('mobile');
        if (mobile && mobile.startsWith('+233')) {
            // Remove Bearer from string
            mobile = mobile.replace('+233', '0');
        }else if(mobile && mobile.startsWith('233')) {
            // Remove Bearer from string
            mobile = mobile.replace('233', '0');
        }    
        var data = {
            fullname: firstname+' '+lastname, mobile: mobile, email: "alias@gmail.com", gender: gender, source: "USSD"
        };
        await postCustomer(data, (data) => {
            if (data.active) {
                menu.con('Your account has been registered successfully. Press (0) zero to continue to Main Menu..')
            }else{
                menu.end(data.message || 'Registration not Successful')
            }
        })

    },
    next: {
        '0': 'Start'
    }
})

menu.state('Exit', {
    run: () => {
        menu.end('')
    }
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
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Account Number '+account.code,merchantid:account.merchantid };
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
        menu.end('Thank you for using Aslan Credit Union.');
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
            menu.con('Your '+account.type+' balance is GHS '+ result.balance+ '\nEnter zero(0) to continue');
        });
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'CheckBalance.amount'
});


///////////////--------------CLAIMS STARTS--------------////////////////

menu.state('Claims', {
    run: () => {
        menu.end('You will be contacted shortly.')
    }
})




// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    // console.log(args);
    menu.run(args, ussdResult => {
        if (args.Operator) { menu.session.set('network', args.Operator);}
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
    console.log(api_endpoint);
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
    console.log(api_endpoint);
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


async function getInfo(val, callback) {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
    }    

    var api_endpoint = apiurl + 'getInfo/' + access.code + '/' + access.key + '/' + val;
    var req = unirest('GET', api_endpoint)
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