const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};
// let types = ["", "Current", "Savings", "Susu"];
// let maritalArray = ["", "Single", "Married", "Divorced", "Widow", "Widower", "Private"];
let optionArray = [null, 'DAILY', 'WEEKLY', 'MONTHLY', null];
const regex = /^[a-zA-Z]*$/;

//Test Credentials
// let apiurl = "https://app.alias-solutions.net:5008/ussd/";
// let apiSchemeInfo = "https://app.alias-solutions.net:5008/";
// let access = { code: "446785909", key: "164383692" };

//Live Credentials
let apiurl = "https://app.alias-solutions.net:5009/ussd/";
let apiSchemeInfo = "https://app.alias-solutions.net:5009/";
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
    menu.end(err);
});

// Define menu states
menu.startState({
    run: async() => {
        // Fetch Customer information
        
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            if(data.active) {     
                menu.con('Welcome to People\'s Pensions Trust' + 
                '\n1. Pay' +
                '\n2. iCare' +
                '\n3. Check Balance' +
                '\n4. Withdrawal' +
                '\n5. Contact us')
            } else {
                menu.con('Welcome to People\'s Pensions Trust, Press 0 (zero) to confirm your registration details. \n0. Register');
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
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            if(data.active) {     
                menu.con('Welcome to People\'s Pensions Trust' + 
                '\n1. Pay' +
                '\n2. iCare' +
                '\n3. Check Balance' +
                '\n4. Withdrawal' +
                '\n5. Contact us')
            } else {
                menu.con('Welcome to People\'s Pensions Trust, Press 0 (zero) to confirm your registration details. \n0. Register');
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
    },
    defaultNext: 'Start'
});


menu.state('Register', {
    run: async() => {
        let mobile = menu.args.phoneNumber;
        menu.session.set('mobile', mobile);        
        await getInfo(mobile, async(data) =>{
            var firstname = "";
            var lastname = "";
            if(data.firstname && data.lastname){
                firstname = data.firstname;
                lastname = data.lastname;
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
        '0': 'Register.change',
        '1': 'Register.amount',
    }
});


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
            var firstname = await menu.session.get('firstname');
            // var mobile = await menu.session.get('mobile');
            var mobile = menu.args.phoneNumber;
            menu.con('Please confirm the registration details below to continue:' +
            '\nFirst Name - ' + firstname +
            '\nLast Name - '+ lastname + 
            '\nMobile Number - '+ mobile +
            '\n\n0. Make Changes' +
            '\n1. Confirm')
    },
    next: {
        '0': 'Register.change',
        '1': 'Register.amount',
    }
})

menu.state('Register.amount', {
    run: async() => {
        var firstname = await menu.session.get('firstname');
        menu.con('Dear '+ firstname +', how much would you like to pay?')
    },
    next: {
        '*[0-9]+': 'Register.frequency'
    }
});

menu.state('Register.frequency', {
    run: () => {
        let amount = Number(menu.val);
        // save user input in session
        if(amount < 1) { menu.end("Minimum Amount is GHS 1") }
        else if(amount > 5000) { menu.end("Maximum Amount is GHS 5000") }
        else
        {
        menu.session.set('amount', amount)
        menu.con('Choose Option:' +
        '\n1. Daily' +
        '\n2. Weekly'+
        '\n3. Monthly' +
        '\n4. One time')
        }
    },
    next: {
        '*[0-4]+': 'Register.complete',
    }
});


menu.state('Register.complete', {
    run: async() => {
        var frequency = optionArray[Number(menu.val)];    
        var firstname = await menu.session.get('firstname');
        var lastname = await menu.session.get('lastname');
        var network = menu.args.operator;
        var amount = await menu.session.get('amount');
        var mobile = menu.args.phoneNumber;
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, email: 'n/a', gender: 'N/A', source: "USSD", frequency: frequency, amount: amount, network: network, payermobile: menu.args.phoneNumber,
        };
        await postCustomer(data, (data) => {
            // menu.end('Request submitted successfully. You will receive a payment prompt shortly')
            
        },
        async (error) => {
            // menu.end( error.status_message ? error.status_message : 'Error in creating customer. Please contact the administrator')
        })

        menu.end('You will receive a payment prompt shortly if request submitted successfully')
    }
})

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using People\'s Pension Trust.');
    }
})


///////////////--------------PAY ROUTE STARTS--------------////////////////
menu.state('Pay', {
    run: async() => {
        await fetchCustomer(menu.args.phoneNumber, (data)=> { 
            if(data.active) {   
                menu.con('Choose Option:' +
                '\n1. Daily' +
                '\n2. Weekly'+
                '\n3. Monthly' +
                '\n4. One time' + 
                '\n5. Stop Repeat Payment')    
            } else {
                menu.go('InvalidInput');
            }
        });
            
    },
    next: {
        '4': 'Pay.account',
        '5': 'Srp',
        '*[1-3]+': 'Pay.view'
    }
})

menu.state('Pay.account', {
    run: async() => {
        await filterPersonalSchemeOnly(menu.args.phoneNumber, async(data) => {
            if (data.active && data.accounts) {
                menu.session.set('account', data.accounts);
                menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else {
                menu.end('Dear Customer, you do not have a Personal Pension Scheme');
                // menu.end('Dear Customer, you have not been registered. Enter (0) to Continue')
            }
        })
},
    next: {
        '*\\d+': 'Pay.Option.OneTimeAmount'
    }
})

menu.state('Pay.view', {
    run: async() => {
    var index = Number(menu.val);
        if (index > 3) {
            menu.con('Incorrect Selection. Enter zero(0) to retry again')
        } else {
            var option = optionArray[index];
            menu.session.set('paymentoption', option);
            // var accounts = await menu.session.get('accounts');
            // let account = await filterPersonalSchemeOnly(accounts);
            // menu.session.set('account', account);
            // var data = {appId: access.code, appKey: access.key, mobile: menu.args.phoneNumber}
            await filterPersonalSchemeOnly(menu.args.phoneNumber, async(data) => {
                if (data.accounts) {
                    let account = data.accounts
                    menu.session.set('account', account);
                    // await fetchCustomer(menu.args.phoneNumber, (data)=> { 
                        if(data.active) {
                            menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
                        } else {
                            menu.end('Dear Customer, you do not have a Active Personal Pension Scheme.');
                        }
                    // });
                } else {
                    menu.end('Dear Customer, you do not have a Personal Pension Scheme.')
                }
            });
        }
    },
    next: {
        '*\\d+': 'Pay.Option.Amount',
        '0': 'Pay'
    }
});

menu.state('Pay.Option.Amount', {
    run: async() => {
        let amount = Number(menu.val);
        if(amount < 1) { menu.end("Minimum Amount is GHS 1") }
        else if(amount > 5000) { menu.end("Maximum Amount is GHS 5000") }
        else
        {
            menu.session.set('amount', amount); 
            menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
            '\n1. Proceed' +
            '\n0. Exit'
            )
        }
},
    next: {
        '1': 'Pay.send',
        '0': 'Exit'
    }
})

menu.state('Pay.Option.OneTimeAmount', {
    run: async() => {
        let amount = Number(menu.val);
        // save user input in session
        if(amount < 1) { menu.end("Minimum Amount is GHS 1") }
        else if(amount > 5000) { menu.end("Maximum Amount is GHS 5000") }
        else
        {
        menu.session.set('amount', amount);  
        menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
        '\n1. Proceed' +
        '\n0. Exit'
        )
        }
},
    next: {
        '1': 'Pay.send',
        '0': 'Exit'
    }
})

menu.state('Pay.Option.Complete', {
    run: async () => {
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var paymentoption = await menu.session.get('paymentoption');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code, frequency: paymentoption, type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+account.schemenumber,merchantid:account.merchantid};
        await postAutoDeposit(data, async(data) => {

        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
})

menu.state('Pay.Option.account', {
    run: async() => {
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
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD', withdrawal:false, reference:'Deposit to Scheme Number '+account.schemenumber};
        await postDeposit(data, async(result)=> { 
            // menu.end(JSON.stringify(result)); 
            menu.end('Request submitted successfully. You will receive a payment prompt shortly')
        }, 
        async (error) => {
            menu.end('Sorry request could not be processed')
        }); 
        menu.end('Request submitted successfully. You will receive a payment prompt shortly');
    }
});


///////////////--------------ICARE ROUTE STARTS--------------////////////////

menu.state('Icare', {
    run: async () => {
        const cust_name = await menu.session.get('name');
        if(cust_name)
        {
            menu.con('Choose Preferred Option:' +
            '\n1. Register for Someone' +
            '\n2. Pay for Someone')
        }
        else
        {
            menu.go('InvalidInput');
        }
    },
    next: {
        '1': 'Icare.register',
        '2': 'Icare.deposit',
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
        let mobile = menu.val;
        if (mobile && mobile.startsWith('0')) {
            // Remove Bearer from string
            mobile = '+233' + mobile.substr(1);
        }else if(mobile && mobile.startsWith('233')) {
            // Remove Bearer from string
            mobile = '+233' + mobile.substr(3);
            // mobile = mobile.replace('233', '+233');
        }
        menu.session.set('mobile', mobile);        
        await getInfo(mobile, async(data) =>{
            if(data.valid){
                var firstname = data.firstname;
                var lastname =  data.lastname;
                menu.session.set('firstname', firstname)
                menu.session.set('lastname', lastname)

            }else{
                menu.end('Mobile Number not Valid')
            }
            menu.con('Please confirm Person\'s details:' +
            '\nFirst Name: ' + firstname +
            '\nLast Name: ' + lastname +
            
            '\n\n0. Make Changes' +
            '\n1. Confirm')
        });
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
            // if (mobile && mobile.startsWith('0')) {
            //     // Remove Bearer from string
            //     mobile = mobile.replace('0', '+233');
            // }else if(mobile && mobile.startsWith('233')) {
            //     // Remove Bearer from string
            //     mobile = mobile.replace('233', '+233');
            // }    
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
        // var name = await menu.session.get('name');
        var mobile = await menu.session.get('mobile');
        var data = {
            firstname: firstname, lastname: lastname, mobile: mobile, gender: 'N/A', email: null, source: "USSD"
        };
        await postCustomer(data, (data) => {
            menu.con('Choose Option:' +
            '\n1. Daily' +
            '\n2. Weekly'+
            '\n3. Monthly' +
            '\n4. One time' + 
            '\n5. Stop Repeat Payment')
        },
        async (error) => {
            menu.end( 'Sorry something went wrong. Please contact the administrator')
        });
    },
    next: {
        '4': 'Icare.mobile',
        '5': 'Srp',
        '*[0-3]+': 'Pay.view'

    }
})

menu.state('Icare.mobile', {
    run: async() => {
        var mobile = await menu.session.get('mobile');        
        await filterPersonalSchemeOnly(mobile, (data)=> { 
            if(data.active && data.accounts) { 
                let account = data.accounts
                menu.session.set('account', account)
                menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else if(data.active && data.accounts == null) {
                menu.con('Mobile Number does not have a Personal Pension Scheme.')
            } else {
                menu.con('Mobile Number not Registered. Enter (0) to Continue');
            }
        });
},
    next: {
        '0': 'Start',
        '*\\d+': 'Deposit.view'
    },
    defaultNext: 'Deposit.view'
});

menu.state('Icare.options', {
    run: () => {
        
        var phone_number = menu.val;
        menu.session.set('icare_phone_number', phone_number)

        menu.con('Choose Option:' +
        '\n1. Daily' +
        '\n2. Weekly'+
        '\n3. Monthly' +
        '\n4. One time' + 
        '\n5. Stop Repeat Payment')
    },
    next: {
        // '4': 'Icare.Deposit',
        '5': 'Srp',
        '*[1-4]+': 'Icare.view'
    }
})

menu.state('Icare.deposit', {
    run: () => {
        menu.con('Enter Mobile Number of Person');
    },
    next: {
        '*[0-9]{10,}': 'Icare.deposit.mobile'
    }
})

menu.state('Icare.deposit.mobile', {
    run: async() => {
        var mobile = menu.val;
        if (mobile && mobile.startsWith('0')) {
            // Remove Bearer from string
            mobile = '+233' + mobile.substr(1);
        }else if(mobile && mobile.startsWith('233')) {
            // Remove Bearer from string
            mobile = '+233' + mobile.substr(3);
        }
        menu.session.set('mobile', mobile);
        await filterPersonalSchemeOnly(mobile, (data)=> { 
            if(data.active && data.accounts) {
                menu.session.set('account', data.accounts)
                menu.con('Choose Option:' +
                '\n1. Daily' +
                '\n2. Weekly'+
                '\n3. Monthly' +
                '\n4. One time' + 
                '\n5. Stop Repeat Payment');
                // menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else if(data.active && data.accounts === null) {
                menu.con('Mobile Number does not have a Personal Pension Scheme.');
            } else {
                menu.con('Mobile Number not Registered. Enter (0) to Continue');
            }
        });
    },
    next: {
        '0': 'Start',
        '*\\d+': 'Icare.mobile'
    }
});

menu.state('Icare.view', {
    run: async() => {
    var index = Number(menu.val);
        if (index > 4) {
            menu.end('Incorrect Selection')
        } else {
            var option = optionArray[index];
            menu.session.set('paymentoption', option);
            var mobile = await menu.session.get('mobile');
            // var data = {appId: access.code, appKey: access.key, mobile: mobile}
            await filterPersonalSchemeOnly(mobile, async(data) => {
                if (data.accounts) {
                    let account = data.accounts
                    menu.session.set('account', account);
                    menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
                } else {
                    menu.con('Dear Customer, you do not have a Personal Pension Scheme.')
                }
            });
        }
    },
    next: {
        '0': 'Icare.PayForSomeone',
        '*\\d+': 'Pay.Option.Amount',
    }
});


menu.state('Deposit.view', {
    run: async() => {
        let amount = Number(menu.val);
        // save user input in session
        if(amount < 1) { menu.end("Minimum Deposit Amount is GHS 1") }
        else if(amount > 5000) { menu.end("Maximum Deposit Amount is GHS 5000") }
        else
        {
            menu.session.set('amount', amount);
            
            menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
            '\n1. Proceed' +
            '\n0. Exit'
            )
        }
    },
    next: {
        '0': 'Deposit.cancel',
        '1': 'Deposit.send',
    }
})

menu.state('Deposit.send', {
    run: async() => {
        // access user input value save in session
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        var data = { merchant:access.code,account:account.code,type:'Deposit',network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD',withdrawal:false,reference:'Payment received for ' + account.code};
        await postDeposit(data, async(result)=> { 
            menu.end('Request submitted successfully. You will receive a payment prompt shortly');
        }, async (error) => {
            // console.log('Sorry request could not be processed ' + error)
        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly');
    }
});

menu.state('Deposit.cancel', {
    run: () => {
        // Cancel Deposit request
        menu.end('Thank you for using People Pension Trust.');
    }
});

menu.state('Srp', {
    run: async() => {
        let mobile = menu.args.phoneNumber;
        await filterPersonalSchemeOnly(mobile, async(data)=> { 
            if(data.active && data.accounts) {
                let val={account:data.accounts.code,mobile:menu.args.phoneNumber, source:'USSD' };
                await stopAutoDeposit(val, (result)=>{
                    if(result.code) {
                        menu.end('You have successfully cancelled your Repeat Payments');
                    } else {
                        menu.con('Mobile Number not Registered. Enter (0) to Continue');
                    }
                });
            } else if(data.active && data.accounts == null) {
                menu.end('Mobile Number does not have a Personal Pension Scheme.')
            } else {
                menu.end('Mobile Number not Registered. Enter (0) to Continue');
            }
        });
    }
});



///////////////--------------CHECK BALANCE ROUTE STARTS--------------////////////////

menu.state('CheckBalance',{
    run: async() => {
        // var data = {appId: access.code, appKey: access.key, mobile: menu.args.phoneNumber}
                await filterPersonalSchemeOnly(menu.args.phoneNumber, async(data) => {
                    if (data.accounts) {
                        let account = data.accounts;
                        menu.session.set('account', account);
                        await fetchBalance(account.code, async(result)=> { 
                            if(result.balance != null) { account.balance = result.balance; }
                            menu.session.set('account', account);
                            menu.session.set('balance', result.balance);
                            menu.con('Your Balance is Savings: GHS '+ parseFloat(result.savings).toFixed(2)+ '\nRetirement: GHS '+parseFloat(result.retirement).toFixed(2) +'.\nEnter zero(0) to continue');
                        });
                    } else {
                        menu.end('Dear Customer, you do not have a Pensonal person scheme. please try again');
                    }
                })
    },
    next: {
        '0': 'Start',
    },
    defaultNext: 'CheckBalance'
});

///////////////--------------WITHDRAWAL ROUTE STARTS--------------////////////////

menu.state('Withdrawal',{
    run: async() => {
        // var data = {appId: access.code, appKey: access.key, mobile: menu.args.phoneNumber}

                await filterPersonalSchemeOnly(menu.args.phoneNumber, async(data) => {
                    if (data.accounts) {
                        // let account = {user: data, code: data.scheme.schemenumber}
                        let account = data.accounts;
                        menu.session.set('account', data.accounts);
                        await fetchBalance(account.code, async(result)=> { 
                            if(result.savings > 0) {
                                account.balance = result.savings;
                                menu.session.set('account', account);
                                menu.session.set('balance', result.savings);
                                menu.con('How much would you like to withdraw from account number '+account.code+'?');
                            } else {
                                menu.end('Error Retrieving Account Balance with '+account.code+', please try again');
                            }
                        });
                    } else {
                        menu.end('Dear Customer, you do not have a Personal Pension Scheme. please try again.');
                    }
                })
                // menu.con('How much would you like to withdraw from account number '+account.code+'?');

                
    },
    next: {
        '*\\d+': 'Withdrawal.view',
    },
    defaultNext: 'Withdrawal'
})

menu.state('Withdrawal.view',{
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        if(amount < 1) { menu.end("Minimum Withdrawal Amount is GHS 1") }
        else if(amount > 5000) { menu.end("Maximum Withdrawal Amount is GHS 5000") }
        else
        {
            menu.session.set('amount', amount);
            var cust = await menu.session.get('cust');
            var account = await menu.session.get('account');
            var balance = await menu.session.get('balance');
            if(balance >= amount) {
                menu.con(cust.fullname +', you are making a Withdrawal Request of GHS ' + amount +' from your '+account.type+' account' +
                '\n1. Confirm' +
                '\n2. Cancel' +
                '\n#. Main Menu');
            } else {
                menu.con('Not Enough Savings in Account. Enter zero(0) to continue')
            }
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
        
        menu.end('Sorry, Withdrawal could not be processed');
        // await postWithdrawal(data, async(result)=> { 
        //     // menu.end(JSON.stringify(result));
        //     if(result.message)
        //     {
        //         menu.end(result.message);
        //     }
        //     else
        //     {
        //         menu.end('Sorry, Withdrawal could not be processed');
        //     }
        // });
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
    run: async () => {

        await fetchCustomer(menu.args.phoneNumber, async (data)=> { 
            if(data.active) {

                menu.con('1. Stop Repeat Payment' +
                '\n2. Name' +
                '\n3. Email' +
                '\n4. Mobile' +
                '\n5. Website');
        
            } else {
                menu.go('InvalidInput');
            }
        });
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

menu.state('InvalidInput', {
    run: () => {
        menu.end('Sorry you selected the wrong option');
    },
});

/////////////////------------------USSD SESSION STARTS------------------/////////////////////
// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
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

// async function filterPersonalSchemeOnly(accounts) {
//     return accounts.find(obj => {
//         return obj.type.includes('PERSONAL');
//     });
// }

function buyAirtime(phone, val) {
    return true
}

async function postCustomer(val, callback, errorCallback) {
    var api_endpoint = apiurl + 'CreateCustomer/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async(resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                // return res;
                await errorCallback(resp.request.body);
            }
            else
            {
            var response = JSON.parse(resp.raw_body);
            await callback(response);
            }
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
                // return res;
                await callback(resp);
            }
            else
            {
            var response = JSON.parse(resp.raw_body);
            await callback(response);
            }
        });
    return true
}

// async function getSchemeInfo(val, callback) {
//     var api_endpoint = apiSchemeInfo + 'Integration/MemberInfo';
//     var req = unirest('POST', api_endpoint)
//         .headers({
//             'Content-Type': 'application/json'
//         })
//         .send(JSON.stringify(val))
//         .end(async (resp) => {
//             // if (res.error) throw new Error(res.error); 
//             if (resp.error) {
//                 // return res;
//                 await callback(resp);
//             }
//             else {
//             var response = JSON.parse(resp.raw_body);
//             await callback(response);
//             }
//         });
//     return true
// }

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
                // return res;
                await callback(resp);
            }
            else
            {
            var response = JSON.parse(resp.raw_body);
            await callback(response);
            }
        });
    return true
}

async function fetchIcareCustomer(val, callback) {
    // try {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if(val && val && val.startsWith('233')){
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getIcare/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            else
            {
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                menu.session.set('name', response.fullname);
                menu.session.set('mobile', val);
                // menu.session.set('accounts', response.accounts);
                // menu.session.set('cust', response);
                // menu.session.set('pin', response.pin);
                // menu.session.set('limit', response.result.limit);
            }

            await callback(response);
            }
        });
    // }
    // catch(err) {
    //     return err;
    // }
}

async function fetchCustomer(val, callback) {
    // try {
        if (val && val && val.startsWith('0')) {
            // Remove Bearer from string
            val = '+233' + val.substr(1);
        } else if(val && val && val.startsWith('233')){
            val = '+233' + val.substr(3);
        } 
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            else
            {
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
            }
        });
    // }
    // catch(err) {
    //     return err;
    // }
}

async function fetchBalance(val, callback) {
    var api_endpoint = apiurl + 'getBalance/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            await callback(resp);
        }
        else 
        {
            var response = JSON.parse(resp.raw_body);
            if(response.balance)
            {
                menu.session.set('balance', response.balance);
            }
            
            await callback(response);
        }
    });
}

async function postAutoDeposit(val, callback) {
    var api_endpoint = apiurl + 'AutoDebit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        if (resp.error) { 
            await callback(resp);
        }
        else
        {
            // if (res.error) throw new Error(res.error); 
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        }
    });
    return true
}

async function stopAutoDeposit(val, callback) {
    var api_endpoint = apiurl + 'AutoDebit/'+access.code+'/'+access.key;
    var req = unirest('DELETE', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // if (resp.error) throw new Error(resp.error); 
        if(resp.error)
        {
            var respons = JSON.parse(resp.raw_body);
            await callback(respons);
        }
        else
        {
        var response = JSON.parse(resp.raw_body);
        await callback(response);
        }
    });
    return true
}

async function postDeposit(val, callback, errorCallback) {
    var api_endpoint = apiurl + 'Deposit/'+access.code+'/'+access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        if (resp.error) { 
            await errorCallback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        else
        {
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        }
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
        if(resp.error)
        {
            await callback(resp);
        }
        else
        {
            var response = JSON.parse(resp.raw_body);
            await callback(response);

        }
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
        if(resp.error)
        {
            await callback(resp);
        }
        else
        {
        var response = JSON.parse(resp.raw_body);
        await callback(response);
        }
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

async function fetchCustomerAccounts(val, callback) {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if(val && val && val.startsWith('233')){
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomerAccounts/' + access.code+'/'+access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            // var response = JSON.parse(res);
            // return res;
            await callback(resp);
        }
        else
        {
        var response = JSON.parse(resp.raw_body);
        
        await callback(response);
        }
    });
}

async function fetchCustomerAccount(val, callback) {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if(val && val && val.startsWith('233')){
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomerAccount/' + access.code+'/'+access.key + '/' + val.mobile+ '/' + val.index;
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            // var response = JSON.parse(res);
            // return res;
            await callback(resp);
        }
        else{
        var response = JSON.parse(resp.raw_body);
        
        await callback(response);
        }
    });
}


async function filterPersonalSchemeOnly(val, callback) {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if(val && val && val.startsWith('233')){
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomer/Personal/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
    .end(async (resp) => {
        if (resp.error) {
            await callback(resp);
        }
        else
        {
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        }
    });
}
