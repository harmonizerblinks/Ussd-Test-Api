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


///////////////---------------------MENU ROUTE STARTS----------------------////////////////
menu.startState({
    run: () => {
        menu.con('Enter Referral Code')
    },
    next: {
        '*\\d+': 'code'
    }
})

menu.state('Start', {
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
        await fetchOfficer(referralcode, async(data) => {
            // console.log(data)
            if(data.active) {     
                menu.con('Dear Customer, please confirm Officer\'s Details: ' + '\n' + data.name + '\n\n1. Confirm \n0. Back')
            }else{
                menu.con('Dear Customer, your referral code is invalid.')
            }
        })
    },
    next: {
        '1': 'Confirm.officer',
        '0': 'Start'
    }
})

menu.state('Confirm.officer', {
    run: async() => {
        await fetchCustomer(menu.args.phoneNumber, async(data) => {
            // console.log(1, "First Check Done")
            if(data.active) {     
                menu.con(`Dear ${data.fullname}, How much would you like to pay?`)
            }else{
                let mobile = menu.args.phoneNumber;
                if (mobile && mobile.startsWith('+233')) {
                    // Remove Bearer from string
                    mobile = mobile.replace('+233', '0');
                }else if(mobile && mobile.startsWith('233')) {
                    // Remove Bearer from string
                    mobile = mobile.replace('233', '0');
                }
                menu.session.set('mobile', mobile);        
                await getInfo(mobile, async(data) =>{
                    // console.log(data.body)
                    if(data.surname && data.surname == null || data.lastname == null){
                        var name = data.firstname;
                        var nameArray = name.split(" ")
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
                        var lastname = data.surname || data.lastname;
                        menu.session.set('firstname', firstname)
                        menu.session.set('lastname', lastname)
                    }
                    menu.con('Please confirm Person\'s details:' +
                    '\nFirst Name: ' + firstname +
                    '\nLast Name: ' + lastname +
                    
                    '\n\n0. Make Changes' +
                    '\n1. Confirm')
                })
           
            }
        });
    },
    next: {
        '*\\d+': 'pay',
        '0': 'Register.change',
        '1': 'Register.autogender',
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
    run: () => {
        let lastname = menu.val;
        menu.session.set('lastname', lastname);
        menu.con('Select Person\'s gender:' +
            '\n1. Male' +
            '\n2. Female'
        )
    },
    next: {
        '*\\d+': 'Register.gender'
    }
})

menu.state('Register.autogender', {
    run: () => {
        menu.con('Select Person\'s gender:' +
            '\n1. Male' +
            '\n2. Female'
        )
    },
    next: {
        '*\\d+': 'Register.gender'
    }
})

menu.state('Register.gender', {
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
            }else if(mobile && mobile.startsWith('233')) {
                // Remove Bearer from string
                mobile = mobile.replace('233', '0');
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
        '0': 'Register.register',
        '1': 'Register.complete',
    },
    defaultNext: 'Register.gender'
})

menu.state('Register.complete', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var officer = await menu.session.get('officer');
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
            firstname: firstname, lastname: lastname, mobile: mobile, gender: gender, email: "alias@gmail.com", source: "USSD", referer_code: officer.code
        };
        await postCustomer(data, (data) => {
            if(data.schemenumber) {
                menu.con('Dear '+ data.name + ', you have successfully registered for the People\'s Pension Trust' + 
                '\nHow much would you like to pay?');
            } else {
                menu.end(data.message || 'Dear Customer, the number you entered is already registered.');
            }
        })

    },
    next: {
        '*\\d+': 'pay'
    }
})

menu.state('exit', {
    run: () => {
        menu.end('')
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

async function fetchOfficer(val, callback) {
    // try {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233','0');
        }
        var api_endpoint = apiurl + 'getOfficer/' + access.code + '/'+ access.key + '/'+ val;
        // console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            if (resp.error) { 
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            // console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            if(response.active)
            {
                menu.session.set('officer', response);
                // menu.session.set('limit', response.result.limit);
            }
            
            await callback(response);
        });
}

