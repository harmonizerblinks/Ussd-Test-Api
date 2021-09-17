const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
// let types = ["", "Current", "Savings", "Susu"];
// let maritalArray = ["", "Single", "Married", "Private", "Divorced", "Widow", "Widower", "Private"];
let genderArray = ["", "Male", "Female"];
let policyArray = ["", { product: "Standard Policy Plan", amount: 5 }, { product: "Bronze Policy Plan", amount: 1 }, { product: "Silver Policy Plan", amount: 3 }, { product: "Gold Policy Plan", amount: 5 }, { product: "Diamond Policy Plan", amount: 10 }];
let paymentplanArray = ["", "Daily", "Weekly", "Monthly"];
var numbers = /^[0-9]+$/;


// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5010/ussd/";

let access = { code: "ENTLIFE", key: "1029398" };
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
    run: async () => {
        // Fetch Customer information

        //menu.end('Dear Customer, \nAhaConnect Service (*789*8#) is down for an upgrade. You will be notified when the service is restored. We apologise for any inconvenience.');
        await fetchCustomer(menu.args.phoneNumber, (data) => {
            // console.log(1,data); 
            if (data && data.active) {
                menu.session.set('cust', data);
                menu.con('Dear ' + data.fullname + ',\nWelcome to Enterprise Life Boafo Pa.' +
                    '\nSelect an Option.' +
                    '\n1. Payment' +
                    '\n2. Check Status' +
                    '\n3. Claims' +
                    '\n4. Policies' +
                    '\n5. Agent');
            } else {
                menu.con('Welcome to Enterprise Life Boafo Pa. Press (0) zero to register \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Register',
        '1': 'Deposit',
        '2': 'CheckStatus',
        '3': 'Claims',
        '4': 'Policies',
        '5': 'Agent'
    }
});

menu.state('Start', {
    run: async () => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, async(data) => {
            console.log(1,data); 
            if (data && data.active) {
                menu.session.set('cust', data);
                menu.con('Dear ' + data.fullname + ',\nWelcome to Enterprise Life Boafo Pa.' +
                    '\nSelect an Option.' +
                    '\n1. Payment' +
                    '\n2. Check Status' +
                    '\n3. Claims' +
                    '\n4. Policies' +
                    '\n5. Agent');
            } else {
                menu.con('Welcome to Enterprise Life Boafo Pa. Press (0) zero to register \n0. Register');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Register',
        '1': 'Deposit',
        '2': 'CheckStatus',
        '3': 'Claims',
        '4': 'Policies',
        '5': 'Agent'
    },
    defaultNext: 'Start'
});

menu.state('Register', {
    run: async () => {
        let mobile = menu.val;
        if (mobile == 0) {
            mobile = menu.args.phoneNumber;
            menu.session.set('mobile', mobile);
        } else {
            if (mobile && mobile.startsWith('0')) {
                // add +233 from string
                mobile = '+233' + mobile.substr(1);
            }else if(mobile && mobile.startsWith('233')) {
                // add +233 from string
                mobile = '+233' + mobile.substr(3);
            }
            menu.session.set('mobile', mobile);
        }
        
        // console.log(mobile)
        await getInfo(mobile, async(data) => {
            if (data && data.firstname && data.lastname) {
                var firstname = data.firstname;
                var lastname = data.lastname;
                menu.session.set('firstname', firstname);
                menu.session.set('lastname', lastname);
                menu.con('Please confirm Person\'s details:' +
                '\nFirst Name: ' + data.firstname +
                '\nLast Name: ' + data.lastname +
                '\n\n0. Make Changes' +
                '\n1. Continue');
            } else {
                menu.con('Please confirm Person\'s details:' +
                '\nFirst Name: ' + data.firstname +
                '\nLast Name: ' + data.lastname +
                '\n\n0. Make Changes' +
                '\n1. Continue');
            }
            
        });
    },
    next: {
        '0': 'Register.change',
        '1': 'Register.Gender',
    }
});

menu.state('Register.Gender', {
    run: () => {
        menu.con('Please choose an option for your gender:' +
            '\n1. Male' +
            '\n2. Female')
    },
    next: {
        '*\\d+': 'Register.Policy',
    }
});

menu.state('Register.Policy', {
    run: async () => {
        if (menu.val > 2) {
            menu.con('Invalid option. Press (0) zero to try again.')
        } else {
            let gender = genderArray[Number(menu.val)];
            menu.session.set('gender', gender);

            await AvailablePolicyTypes("life", (accounts)=> { 
                if(accounts.length > 0) {
                    var accts = ''; var count = 1;
                    // menu.session.set('accounts',accounts);
                    // var accounts = await menu.session.get('accounts');
                    accounts.forEach(val => {
                        // console.log(val);
                        accts += '\n'+count+'. '+val.name;
                        count +=1;
                    });
                    menu.con('Select Policy Type' + accts);
                } else {
                    menu.end('Unable to Fetch Policy Types, please try again');
                }
            }).catch((err)=>{ menu.end(err); });
        }
    },
    next: {
        '*\\d+': 'Register.Policy.Selected',
    },
    defaultNext: 'Start'
});

menu.state('Register.Policy.Selected', {
    run: async () => {
        if (menu.val > 5) {
            menu.end('Invalid option. Please try again.')
        } else {
            // menu.session.set('policyoption', policyArray[Number(menu.val)])
            var val = { type:'life', index: menu.val };
            await AvailablePolicyType(val, (type)=> { 
                // console.log(account);
                if(type && type.active) {
                    menu.session.set('policy',type);
                    
                    menu.con(type.description +
                        '\n1. Proceed' +
                        '\n2. Cancel');
                } else {
                    menu.end('Unable to Fetch Selected Policy, please try again');
                }
            });
            // menu.con('Select Payment Plan:' +
            //     '\n1. Daily' +
            //     '\n2. Weekly' +
            //     '\n3. Monthly')
        }
    },
    next: {
        '0': 'Start',
        '1': 'Register.Policy.Confirm',
        '2': 'Exit',
        '*\\d+': 'Register.Policy.Option',
    },
    defaultNext: 'Start'
});

menu.state('Register.Policy.Confirm', {
    run: async () => {
        if (menu.val > 3) {
            menu.con('Invalid option. Press (0) zero to try again.')
        } else {
            // let paymentplan = paymentplanArray[Number(menu.val)]
            // menu.session.set('paymentplan', paymentplan)
            let policy = await menu.session.get('policy');
            var firstname = await menu.session.get('firstname');
            var lastname = await menu.session.get('lastname');
            var fullname = firstname + ' ' + lastname;
            menu.con('Dear ' + fullname + ', please confirm your registration for the ' + policy.name + ' with a ' + policy.frequency + ' Plan of GHS ' + policy.amount +
                '\n1. Confirm' +
                '\n2. Cancel')
        }
    },
    next: {
        '1': 'Register.Policy.Complete',
        '2': 'Exit'
    }
});

menu.state('Register.Policy.Complete', {
    run: async () => {
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var gender = await menu.session.get('gender');
        var mobile = await menu.session.get('mobile');
        var policy = await menu.session.get('policy');
        // if (mobile && mobile.startsWith('+233')) {
        //     // Remove Bearer from string
        //     mobile = mobile.replace('+233', '0');
        // } else if (mobile && mobile.startsWith('233')) {
        //     // Remove Bearer from string
        //     mobile = mobile.replace('233', '0');
        // }
        
        var data = { code: access.code, key: access.key,
            fullname: firstname + ' ' + lastname, firstname: firstname, lastname: lastname, mobile: mobile, email: "alias@gmail.com", gender: gender, source: "USSD", accountcode: policy.code, amount: policy.amount, network: menu.args.operator,location: 'n/a',agentcode:'n/a', matrialstatus:'n/a', idnumber:'n/a', idtype:'n/a',  dateofbirth: null, 
        };
        await postCustomer(data, (data) => {
            if (data.active) {
                menu.end('Your policy has been registered successfully.')
            } else {
                menu.end(data.message || 'Registration not Successful')
            }
        })
    },
    next: {
        '0': 'Start'
    }
});

//////////////////////////////////////////////////////////////////////////////////////

menu.state('Register.change', {
    run: () => {
        menu.con('Please enter first name')
    },
    next: {
        '*[a-zA-Z]+': 'Register.firstname'
    }
});

menu.state('Register.firstname', {
    run: () => {
        let firstname = menu.val;
        menu.session.set('firstname', firstname);
        menu.con('Please enter last name')
    },
    next: {
        '*[a-zA-Z]+': 'Register.lastname'
    }
})


menu.state('Register.lastname', {
    run: async () => {
        let lastname = menu.val;
        menu.session.set('lastname', lastname);
        var firstname = await menu.session.get('firstname');
        //var lastname = await menu.session.get('lastname');
        var mobile = await menu.session.get('mobile');
        menu.con('Please confirm the Person\'s details' +
            '\nFirst Name - ' + firstname +
            '\nLast Name - ' + lastname +
            '\nMobile Number - ' + mobile +
            '\n\n0. Make Changes' +
            '\n1. Continue')
    },
    next: {
        '0': 'Register.change',
        '1': 'Register.Gender',
    },
    defaultNext: 'Register.lastname'
})

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using our Service')
    }
})

//////////////////////////////////////////////////////////////////////////////////////

menu.state('Deposit', {
    run: async () => {
        let mobile = menu.val;
        if (mobile == 1) {
            mobile = menu.args.phoneNumber;
            menu.session.set('mobile', mobile);
        }
        menu.session.set('mobile', mobile);
        var val = { mobile: mobile, index: 1 };
        await fetchCustomerAccount(val, (data) => {
            if (data.active) {
                menu.session.set('account', data);
                menu.con('You are currently on the '+data.name+', '+data.frequency+' Amount is GHC '+data.amount+'.\n How much would you like to pay?')
            } else {
                menu.end('No Active Policy.')
            }
        });
    },
    next: {
        '*\\d+': 'Deposit.view',
    },
    defaultNext: 'Deposit'
})

menu.state('Deposit.view', {
    run: async () => {
        var amount = Number(menu.val);
        menu.session.set('amount', amount);
        if (amount > 10000) {
            menu.end('Invalid Amount Provided. Please Try again.');
        } else {
            var mobile = await menu.session.get('mobile');
            var val = { mobile: mobile, index: 1 };
            await fetchCustomerAccount(val, (data) => {
                if (data.active) {
                    menu.session.set('account', data);
                    menu.con('Dear, '+data.fullname+', you are making a deposit of GHS ' + amount + ' into your account' +
                    '\n1. Confirm' +
                    '\n2. Cancel' +
                    '\n#. Main Menu');
                    // menu.con('You are currently on the '+data.name+', '+data.frequency+' Amount is GHC '+data.amount+'.\n How much would you like to pay?')
                } else {
                    menu.end('No Currently Active Policy.')
                }
            });
        }
    },
    next: {
        '0': 'Start',
        '#': 'Start',
        '1': 'Deposit.confirm',
        '2': 'Deposit.cancel',
    },
    defaultNext: 'Deposit'
});

menu.state('Deposit.confirm', {
    run: async () => {
        // access user input value save in session
        var cust = await menu.session.get('cust');
        if(!cust) { menu.end('Invalid Input, Please try again.') }
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        if (mobile == undefined) {
            mobile = menu.args.phoneNumber;
        }
        var data = { merchant: access.code, account: account.code, type: 'Deposit', network: network, mobile: mobile, amount: amount, method: 'MOMO', source: 'USSD', withdrawal: false, reference: 'Deposit to Account Number ' + account.code, merchantid: account.merchantid };
        await postDeposit(data, async (result) => {
            // console.log(result) 
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone.');
    }
});

menu.state('Deposit.cancel', {
    run: () => {
        // Cancel Deposit request
        menu.end('Thank you for using Baafo Pa Plus.');
    }
});

//////////////////////////////////////////////////////////////////////////////////////

menu.state('CheckStatus', {
    run: async() => {
        // var mobile = await menu.session.get('mobile');
        var val = { mobile: menu.args.phoneNumber, index: 1 };
        await fetchCustomerAccount(val, async(data) => {
            if (data && data.active) {
                menu.session.set('account', data);
                await CheckStatus(data.code, (dat) => {
                    if (dat && dat.data) {
                        menu.con('Your '+data.name+' is currently active' + '\n '+ dat.data.totalpaid.savings_claim_eligibility.narration +' \n\nPress zero (0) to return to the Main Menu');
                        // menu.con('Dear, '+data.fullname+', you are making a deposit of GHS ' + amount + ' into your account' +
                        // '\n1. Confirm' +
                        // '\n2. Cancel' +
                        // '\n#. Main Menu');
                    } else {
                        menu.end('Unable to get Policy Status Currently, please try again later.')
                    }
                });
            } else {
                menu.end('No Currently Active Policy.')
            }
        });
        // menu.con('Your Gold Policy Plan is currently active' + '\n\nPress zero (0) to return to the Main Menu');
    },
    next: {
        '0': 'Start'
    },
});

//////////////////////////////////////////////////////////////////////////////////////

menu.state('Claims', {
    run: () => {
        menu.end('You will be contacted shortly.')
    }
});

//////////////////////////////////////////////////////////////////////////////////////

menu.state('Policies', {
    run: async () => {
        await AvailablePolicyTypes("life", (accounts)=> { 
            if(accounts.length > 0) {
                var accts = ''; var count = 1;
                // menu.session.set('accounts',accounts);
                // var accounts = await menu.session.get('accounts');
                accounts.forEach(val => {
                    // console.log(val);
                    accts += '\n'+count+'. '+val.name;
                    count +=1;
                });
                menu.con('Select Policy' + accts);
            } else {
                menu.end('Unable to Fetch Policy Types, please try again');
            }
        }).catch((err)=>{ menu.end(err); });
    },
    next: {
        '*\\d+': 'Policies.Selected',
    },
    defaultNext: 'Start'
});

menu.state('Policies.Selected', {
    run: async () => {
        if (menu.val > 5) {
            menu.end('Invalid option. Please try again.')
        } else {
            // menu.session.set('policyoption', policyArray[Number(menu.val)])
            var val = { type:'life', index: menu.val };
            await AvailablePolicyType(val, (type)=> { 
                // console.log(account);
                if(type && type.active) {
                    menu.session.set('policy',type);
                    
                    menu.con(type.name +'\n'+ type.description +
                        '\n0. Menu' +
                        '\n1. Exit');
                } else {
                    menu.end('Unable to Fetch Selected Policy, please try again');
                }
            });
        }
    },
    next: {
        '0': 'Start',
        '1': 'Exit',
    },
    defaultNext: 'Start'
});

//////////////////////////////////////////////////////////////////////////////////////

menu.state('Agent', {
    run: () => {
        menu.con('Choose your Preferred Option:' +
            '\n1. Register for Someone' +
            '\n2. Pay for Someone')
    },
    next: {
        '1': 'Registers',
        '2': 'Pay'
    }
})

menu.state('Registers', {
    run: () => {
        menu.con('Enter Phone Number of person:')
    },
    next: {
        '*[0-9],{10,}+': 'Register.Auto'
    }
})


menu.state('Pay', {
    run: () => {
        menu.con('Enter Phone Number of person:')
    },
    next: {
        '*[0-9],{10,}+': 'Deposit'
    }
});


// Pension USSD
exports.ussdApp = async (req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    // console.log(args);
    await menu.run(args, async(ussdResult) => {
        // if (args.Operator) { menu.session.set('network', args.Operator); }
        res.send(ussdResult);
    });
};


function buyAirtime(phone, val) {
    return true
}

async function postCustomer(val, callback) {
    var api_endpoint = apiurl + 'CreatePolicyHolder/';
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
    // if (val && val.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val = val.replace('+233', '0');
    // }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp.error);
            }
            // console.log(resp.raw_body);
            if(resp.raw_body) {
                var response = JSON.parse(resp.raw_body);

                await callback(response);
            } else { await callback(resp.raw_body);}
        });
    // }
    // catch(err) {
    //     console.log(err);
    //     return err;
    // }
}


async function fetchCustomerAccounts(val, callback) {
    // if (val && val.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val = val.replace('+233','0');
    // }
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
    // if (val.mobile && val.mobile.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val.mobile = val.mobile.replace('+233','0');
    // }
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

async function AvailablePolicyTypes(val, callback) {
    var api_endpoint = apiurl + 'AvailablePolicyTypes/' +val+'?appid='+ access.code+'&key='+access.key;
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

async function AvailablePolicyType(val, callback) {
    // var api_endpoint = apiurl + 'AvailablePolicyType/' + access.code+'/'+access.key + '/' + val.mobile+ '/' + val.index;
    var api_endpoint = apiurl + 'AvailablePolicyType/' + val.type+ '/' + val.index+'?appid='+ access.code+'&key='+access.key;
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


async function CheckStatus(val, callback) {
    var api_endpoint = apiurl + 'GetPolicyStatus/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            
            await callback(response);
        });
}

async function fetchStatement(val, callback) {
    var api_endpoint = apiurl + 'getAccountTransaction/' + access.code + '/' + access.key + '/' + val;
    // console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
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
    var api_endpoint = apiurl + 'Deposit/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            console.log(JSON.stringify(val));
            if (resp.error) {
                console.log(resp.error);
                console.log(resp.raw_body);
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
    var api_endpoint = apiurl + 'Withdrawal/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
    return true
}

async function postChangePin(val, callback) {
    var api_endpoint = apiurl + 'Change/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
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
    // if (val && val.startsWith('+233')) {
    //     // Remove Bearer from string
    //     val = val.replace('+233', '0');
    // } else if (val && val.startsWith('233')) {
    //     // Remove Bearer from string
    //     val = val.replace('233', '0');
    // }

    var api_endpoint = apiurl + 'getInfo/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
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
