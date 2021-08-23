const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};
let optionArray = ["", "DAILY", "WEEKLY", "MONTHLY"];


// Test Credentials
// let apiurl = "http://localhost:5000/Ussd/";
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

// Define menu states
menu.startState({
    run: async() => {
        // Fetch Customer information
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchIcareCustomer(menu.args.phoneNumber, async(data)=> { 
            // console.log('Fetch Icare Started', data); 
            if(data.icareid) {
                menu.con('Welcome to Icare for Peoples Pensions Trust. Choose your Preferred Option:' +
                '\n1. Register for Someone' +
                '\n2. Pay for Someone'
                )                
            } 
            else {
                await fetchCustomer(menu.args.phoneNumber, async(data) =>{
                    // console.log('Fetch Customer Started' ); 
                    if(data.code)
                    {
                        let mobile = menu.args.phoneNumber;
                        // if (mobile && mobile.startsWith('+233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('+233', '0');
                        // }else if(val && val.startsWith('233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('233', '0');
                        // }    
                        var postIcare = {
                            name: data.fullname, mobile: mobile
                        };
                        await postIcareCustomer(postIcare, (data) => {
                            // console.log(data.body)
                            menu.con('Welcome to Peoples Pensions Trust. Choose your Preferred Option:' +
                            '\n1. Register for Someone' +
                            '\n2. Pay for Someone'
                            )
                        })
                    } else {
                        let mobile = menu.args.phoneNumber;
                        // console.log(mobile)
                        // if (mobile && mobile.startsWith('+233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('+233', '0');
                        // }else if(mobile && mobile.startsWith('233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('233', '0');
                        // }    
                        menu.session.set('mobile', mobile);        
                        await getInfo(mobile, async(data) =>{
                            // console.log('Get Info Started'); 
                            if(data.surname && data.surname == null || data.lastname == null){
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
                                var lastname = data.surname || data.lastname;
                                menu.session.set('firstname', firstname)
                                menu.session.set('lastname', lastname)
                            }
                            menu.con('Please confirm Person\'s details:' +
                            '\nFirst Name: ' + firstname +
                            '\nLast Name: ' + lastname +
                            
                            '\n\n0. Make Changes' +
                            '\n1#. Confirm')
                        })
                    }
                })
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Icare.change',
        '1': 'Icare.register',
        '2': 'Icare.options',
        '1#': 'Icare.complete'
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        
        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchIcareCustomer(menu.args.phoneNumber, async(data)=> { 
            // console.log('Fetch Icare Started', data); 
            if(data.icareid) {
                menu.con('Welcome to Icare for Peoples Pensions Trust. Choose your Preferred Option:' +
                '\n1. Register for Someone' +
                '\n2. Pay for Someone'
                )                
            } 
            else {
                await fetchCustomer(menu.args.phoneNumber, async(data) =>{
                    // console.log('Fetch Customer Started'); 
                    if(data.code)
                    {
                        let mobile = menu.args.phoneNumber;
                        // if (mobile && mobile.startsWith('+233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('+233', '0');
                        // }else if(val && val.startsWith('233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('233', '0');
                        // }    
                        var postIcare = {
                            name: data.fullname, mobile: mobile
                        };
                        await postIcareCustomer(postIcare, (data) => {
                            // console.log(data.body)
                            menu.con('Welcome to Peoples Pensions Trust. Choose your Preferred Option:' +
                            '\n1. Register for Someone' +
                            '\n2. Pay for Someone'
                            )
                        })
                    } else {
                        let mobile = menu.args.phoneNumber;
                        // console.log(mobile)
                        // if (mobile && mobile.startsWith('+233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('+233', '0');
                        // }else if(mobile && mobile.startsWith('233')) {
                        //     // Remove Bearer from string
                        //     mobile = mobile.replace('233', '0');
                        // }    
                        menu.session.set('mobile', mobile);        
                        await getInfo(mobile, async(data) =>{
                            // console.log('Get Info Started'); 
                            if(data.surname && data.surname == null || data.lastname == null){
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
                                var lastname = data.surname || data.lastname;
                                menu.session.set('firstname', firstname)
                                menu.session.set('lastname', lastname)
                            }
                            menu.con('Please confirm Person\'s details:' +
                            '\nFirst Name: ' + firstname +
                            '\nLast Name: ' + lastname +
                            
                            '\n\n0. Make Changes' +
                            '\n1#. Confirm')
                        })
                    }
                })
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Icare.change',
        '1': 'Icare.register',
        '2': 'Icare.options',
        '1#': 'Icare.complete'
    },
    defaultNext: 'Start'
});


///////////////--------------CONFIRM ROUTE STARTS--------------////////////////

menu.state('register', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var mobile = await menu.session.get('mobile');
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, email: "alias@gmail.com", gender: 'N/A', source: "USSD", icareid: icareId
        };
        await postCustomer(data, async(data) => {
            if(data.schemenumber) {
                var postIcare = {
                    name: data.fullname, mobile: menu.args.phoneNumber
                };
                await postIcareCustomer(postIcare, (data) => {
                    menu.con('Welcome to Peoples Pensions Trust. Choose your Preferred Option:' +
                    '\n1. Register for Someone' +
                    '\n2. Pay for Someone'
                    )
                })
                // menu.con('Your account has been created successfully. Press 0 to continue to the Main Menu');
            } else {
                menu.con('Dear Customer, the number you entered is already registered. Press 0 to continue to the Main Menu');
            }
        })
        
    },
    next: {
        '0': 'Start',
        '1': 'Icare.options',
        '2': 'Icare.mobile'
    }
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
            '\n1. Confirm')
        })
    },
    next: {
        '0': 'Icare.change',
        '1': 'Icare.complete',
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
    run: async() => {
            let lastname = menu.val;
            menu.session.set('lastname', lastname);
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
    },
    next: {
        '0': 'Icare.register',
        '1': 'Icare.complete',
    }
})

menu.state('Icare.complete', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var icareId = await menu.session.get('icareid');
        var mobile = await menu.session.get('mobile');
        if (mobile && mobile.startsWith('+233')) {
            // Remove Bearer from string
            mobile = mobile.replace('+233', '0');
        }else if(mobile && mobile.startsWith('233')) {
            // Remove Bearer from string
            mobile = mobile.replace('233', '0');
        }    
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, gender: 'N/A', email: "alias@gmail.com", source: "USSD", icareid: icareId
        };
        await postCustomer(data, (data) => {
            menu.con('Choose Option:' +
            '\n1. Daily' +
            '\n2. Weekly'+
            '\n3. Monthly' +
            '\n4. Only once' + 
            '\n5. Stop Repeat Payment')
        })

    },
    next: {
        '4': 'Deposit.Registration.Once',
        '5': 'Srp',
        '*[0-3]+': 'Pay.view'

    }
})

menu.state('exit', {
    run: () => {
        menu.end('')
    }
})


menu.state('Icare.options', {
    run: () => {
        menu.con('Choose Option:' +
        '\n1. Daily' +
        '\n2. Weekly'+
        '\n3. Monthly' +
        '\n4. Only once' + 
        '\n5. Stop Repeat Payment')
    },
    next: {
        '4': 'Icare.options.mobile',
        '5': 'Srp',
        '*[0-3]+': 'Pay.view'
    }
})

menu.state('Icare.options.mobile', {
    run: () => {
        menu.con('Enter Mobile Number of Person')
    },
    next: {
        '*\\d+': 'Deposit'
    }
})


menu.state('Icare.frequency', {
    run: () => {
        menu.con('Choose Option:' +
        '\n1. Daily' +
        '\n2. Weekly'+
        '\n3. Monthly' +
        '\n4. Only once' + 
        '\n5. Stop Repeat Payment')
    },
    next: {
        '4': 'Deposit.Once',
        '5': 'Srp',
        '*[0-3]+': 'Pay.view'
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

menu.state('Deposit.Once', {
    run: async() => {
        let moblie = await menu.session.get('mobile');
        await fetchCustomer(mobile, (data) => {
            menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
        })
    },
    next: {
        '*\\d+': 'Pay.Confirm.Amount'
    }
});

menu.state('Deposit.Registration.Once', {
    run: async() => {
        var mobile = await menu.session.get('mobile');        
        await fetchCustomer(mobile, (data)=> { 
            // console.log(1,data);  
            if(data.active) {
                menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else {
                menu.con('Mobile Number not Registered. Enter (0) to Continue');
            }
        });
    },
    next: {
        '*\\d+': 'Pay.Confirm.Amount'
    }
});



menu.state('Deposit', {
    run: async() => {
        await fetchCustomer(menu.val, (data)=> { 
            // console.log(1,data);  
            if(data.active) {
                menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else {
                menu.con('Dear Customer, the number you have dialed has not been registered. Enter (0) to Continue');
            }
        });
    },
    next: {
        '0': 'Start',
        '*\\d+': 'Pay.Confirm.Amount'
    }
});

menu.state('Pay.view', {
    run: async() => {
    var index = Number(menu.val);
        if (index > 3) {
            menu.con('Incorrect Selection. Enter zero(0) to retry again')
        } else {
            var option = optionArray[index];
            menu.session.set('paymentoption', option);
            await filterPersonalSchemeOnly(menu.args.phoneNumber, async(data) => {
                if (data.active){
                    menu.session.set('account', data);
                    let name = await menu.session.get('name')
                    menu.con(`Dear ${name}, How much would you like to pay?`)        
                }else{
                    menu.end('Dear Customer, you do not have a scheme number')
                }
            });
        }
    },
    next: {
        '*\\d+': 'Pay.Option.Amount',
    }
});

menu.state('Pay.Option.Amount', {
    run: () => {
        let amount = menu.val;
        menu.session.set('amount', amount); 
        menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
        '\n1. Proceed' +
        '\n0. Exit'
        )
},
    next: {
        '1': 'Deposit.send',
        '0': 'Deposit.cancel'
    }
})


// menu.state('Deposit.account', {
//     run: async() => {
//         let amount = menu.val;
//         menu.session.set('amount', amount);
//         var schemes = ''; var count = 1;
//         var accounts = await menu.session.get('accounts');
//         accounts.forEach(val => {
//             schemes += '\n' + count + '. ' + val.code;
//             count += 1;
//         });
//         menu.con('Please select Preferred Scheme Number: ' + schemes)
//     },
//     next: {
//         '*\\d+': 'Deposit.view',
//     }
// });

// menu.state('Pay.amount', {
//     run: () => {
    // menu.con('Choose Option:' +
    // '\n1. Daily' +
    // '\n2. Weekly'+
    // '\n3. Monthly' +
    // '\n4. Only once' + 
    // '\n5. Stop Repeat Payment')
//     },
//     next: {
    // '4': 'Deposit.Once',
    // '5': 'Srp',
    // '*[0-3]+': 'Pay.view'
//     }
// })


menu.state('Pay.Confirm.Amount', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        var accounts = await menu.session.get('accounts');
        let account = await filterPersonalSchemeOnly(accounts);
        menu.session.set('account', account);

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

menu.state('Deposit.view', {
    run: async() => {
        let amount = menu.session.get('amount');
        var accounts = await menu.session.get('accounts');
        let account = await filterPersonalSchemeOnly(accounts);
        menu.session.set('account', account);

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
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD',withdrawal:false,reference:'Deposit', merchantid:account.merchantid };
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

menu.state('Exit', {
    run: () => {
        menu.end('')
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
        if(args.Operator) {menu.session.set('network', args.Operator); }
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
                menu.session.set('name', response.name);
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
            console.log(resp.body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                menu.session.set('name', response.fullname);
                menu.session.set('mobile', val);
                menu.session.set('accounts', response.accounts);
                menu.session.set('cust', response);
                menu.session.set('pin', response.pin);
                menu.session.set('icareid', response.icareid)
            }else{
                return null;
            }

            await callback(response);
        });
    return true
}

async function fetchCustomer(val, callback) {
    // try {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
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
            }else{
                return null;
            }

            await callback(response);
        });
    // }
    // catch(err) {
    //     console.log(err);
    //     return err;
    // }
}

async function fetchIcareCustomer(val, callback) {
    // try {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233', '0');
        }else if(val && val.startsWith('233')) {
            // Remove Bearer from string
            val = val.replace('233', '0');
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
            }else{
                var response = JSON.parse(resp.raw_body);
                if (response.active) {
                    menu.session.set('name', response.fullname);
                    menu.session.set('mobile', val);
                    menu.session.set('accounts', response.accounts);
                    menu.session.set('cust', response);
                    menu.session.set('pin', response.pin);
                    // menu.session.set('limit', response.result.limit);
                }
            }
            // console.log(resp.raw_body);

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

async function filterPersonalSchemeOnly(val, callback) {
    var api_endpoint = apiurl + 'getCustomer/Pensonal/' + access.code + '/' + access.key + '/' + val;
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
            await callback(response);
        });
}
