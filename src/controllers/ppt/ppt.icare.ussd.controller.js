const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
var generator = require('generate-serial-number');
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
        await fetchCustomer(menu.args.phoneNumber, async(data)=> { 
            // console.log(1,data); 
            if(data.icareid !== 0) {
                menu.con('Welcome to Icare for Peoples Pensions Trust. Choose your Preferred Option:' +
                '\n1. Register for Someone' +
                '\n2. Pay for Someone'
                )
            } else if(data.icareid == 0){
                var postdata = {
                    name: data.fullname, mobile: menu.args.phoneNumber
                };
                await postIcareCustomer(postdata, (data) => {
                    menu.con('Welcome to Peoples Pensions Trust. Choose your Preferred Option:' +
                    '\n1. Register for Someone' +
                    '\n2. Pay for Someone'
                    )
                })
            } 
            else {
                menu.con('Dear Customer, you are not registered on Peoples Pensions Trust. Dial *789*7879# to register.');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'Icare.register',
        '2': 'Icare.phonenumber',
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, async(data)=> { 
            // console.log(1,data); 
            if(data.icareid !== 0) {
                menu.con('Welcome to Icare for Peoples Pensions Trust. Choose your Preferred Option:' +
                '\n1. Register for Someone' +
                '\n2. Pay for Someone'
                )
            } else if(data.icareid == 0){
                var data = {
                    firstname: firstname, lastname: lastname, mobile: mobile, gender: gender, email: "alias@gmail.com", source: "USSD"
                };
                await postIcareCustomer(data, (data) => {
                    menu.con('Welcome to Peoples Pensions Trust. Choose your Preferred Option:' +
                    '\n1. Register for Someone' +
                    '\n2. Pay for Someone'
                    )
                })
            } 
            else {
                menu.con('Dear Customer, you are not registered on Peoples Pensions Trust. Dial *789*7879# to register.');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '1': 'Icare.register',
        '2': 'Icare.phonenumber',
    },
    defaultNext: 'Start'
});


///////////////--------------ICARE > REGISTER ROUTE STARTS--------------////////////////

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
        let mobile = menu.val;
        menu.session.set('mobile', mobile);        
        await getInfo(mobile, async(data) =>{
            if(data.surname == null){
                var name = data.firstname;
                var nameArray = name.split(" ")
                // console.log(nameArray.length)
                if (nameArray.length > 2){
                    var firstname = capitalizeFirstLetter(nameArray[0]);
                    var lastname = capitalizeFirstLetter(nameArray[2]);
                    menu.session.set('firstname', firstname)
                    menu.session.set('lastname', lastname)
                }else{
                    var firstname = capitalizeFirstLetter(nameArray[0]);
                    var lastname = capitalizeFirstLetter(nameArray[1]);
                    menu.session.set('firstname', firstname)
                    menu.session.set('lastname', lastname)
                }

            }else{
                var firstname = data.firstname;
                var lastname = data.surname;
                menu.session.set('firstname', firstname)
                menu.session.set('lastname', lastname)
            }


            menu.con(`Please confirm Person\'s details:
            First Name: ${firstname}
            Last Name: ${lastname}
            
            0. Make Changes
            1. Confirm`)
        })
    },
    next: {
        '0': 'Icare.change',
        '1': 'Icare.autogender',
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

menu.state('Icare.autogender', {
    run: () => {
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
        var icareId = await menu.session.get('icareid');
        var gender = await menu.session.get('gender');
        var mobile = await menu.session.get('mobile');
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, gender: gender, email: "alias@gmail.com", source: "USSD", icareid: icareId
        };
        await postCustomer(data, (data) => {
            if(data.schemenumber) {
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
        '*\\d+': 'Deposit'
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
};

async function postCustomer(val, callback) {
    var api_endpoint = apiurl + 'CreateCustomer/' + access.code + '/' + access.key;
    // console.log(1 ,api_endpoint);
    // console.log(2 ,val);
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
    return true
}

async function getInfo(val, callback) {
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
            // console.log(resp.resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                menu.session.set('name', response.fullname);
                menu.session.set('mobile', val);
                menu.session.set('accounts', response.accounts);
                menu.session.set('cust', response);
                menu.session.set('pin', response.pin);
                menu.session.set('icareid', response.icareid)
            }

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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }