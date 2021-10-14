const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
let dailyPlans = [
    {"name":"GHC 20 Daily", "amount":"20"}, 
    {"name":"GHC 10 Daily", "amount":"10"}, 
    {"name": "GHC 5 Daily", "amount":"5"}
];
let weeklyPlans = [
    {"name":"GHC 100 Weekly", "amount":"100"}, 
    {"name":"GHC 50 Weekly", "amount":"50"}, 
    {"name":"GHC 25 Weekly", "amount":"25"}, 
    ];
let monthlyPlans = [ 
    {"name":"GHC 2000 Monthly", "amount":"2000" },
    {"name":"GHC 1000 Monthly", "amount": "1000"}, 
    {"name":"GHC 500 Monthly", "amount": "500"}
];
const regex = /^[a-zA-Z]*$/;

//Test Credentials
let apiurl = "https://app.alias-solutions.net:5008/ussd/";
let apiSchemeInfo = "https://app.alias-solutions.net:5008/";
let access = { code: "446785909", key: "164383692" };

//Live Credentials
// let apiurl = "https://app.alias-solutions.net:5009/ussd/";
// let apiSchemeInfo = "https://app.alias-solutions.net:5009/";
// let access = { code: "PPT", key: "178116723" };

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
    menu.end(err);
});

let InitialMessage = '';
let InitialNextState = {};

// Define menu states
menu.startState({
    run: async () => {
        // Fetch Customer information
        await fetchCustomer(menu.args.phoneNumber, (data) => {
            if (data.active) {
                menu.con(`Welcome XXX\n` +
                    '1. Check Balance\n' +
                    '2. iCare (Register/Pay for someone)\n' +
                    '3. Top up your account\n' +
                    '4. Change/Stop contribution plan\n' +
                    '5. Withdraw\n' +
                    '6. Contact us')
            } else {
                menu.con(`Welcome to PPT\nPersonal Pension Scheme` +
                    '\n0. Register')
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '0': 'Register',
        '1': 'CheckBalance',
        '2': 'iCare',
        '3': 'Topup',
        '4': 'ChangeStopPlan',
        '5': 'Withdraw',
        '5': 'ContactUs'
    }
});

///////////////--------------START REGISTER STATES--------------////////////////
menu.state('Register', {
    run: async () => {
        menu.con(`Choose a contribution plan.\n`+
        '1. Daily plan\n' +
        '2. Weekly plan\n' +
        '3. Monthly plan\n' +
        '4. iCare (Register/Pay for someone)\n'
        )
    },
    next: {
        '1': 'Register.DailyPlan',
        '2': 'Register.WeeklyPlan',
        '3': 'Register.MonthlyPlan',
        '4': 'Register.iCare'
    },
    defaultNext: '__start__'
});


menu.state('Register.DailyPlan', {
    run: () => {
        let message = '';
        dailyPlans.forEach((element, index) => {
            message += `${(index + 1)}. ${element.name}\n`;
        });
        message+='4. Enter your own amount'
        menu.con( message )
    },
    next: {
        '*[1-3]+': 'Register.DailyPlan.PlanSelected',
        '4': 'Register.DailyPlan.Amount',
    },
    defaultNext: '__start__'
});

menu.state('Register.DailyPlan.PlanSelected', {
    run: () => {

        menu.session.set('dailyplan_index_selected', menu.val);
        let daily_plan_selected = dailyPlans[(Number(menu.val) - 1)];
        menu.con(
            'Make sure you have enough ' +
            'balance to proceed with ' +
            `transaction of GHC ${daily_plan_selected.amount}\n` +
            '1. Proceed\n' +
            '0. Exit'
            )
    },
    next: {
        '1': 'Register.DailyPlan.PlanSelected.Proceed',
        '0': 'Exit',        
    },
    defaultNext: '__start__'
});

menu.state('Register.DailyPlan.PlanSelected.Proceed', {
    run: () => {
        menu.end(
            'Request submitted successfully you will ' +
            'receive a payment prompt shortly' 
            )
    },
});

menu.state('Register.DailyPlan.Amount', {
    run: () => {
        menu.con(
            'Please enter the amount to contribute'
            )
    },
    next: {
        '*\\d+': 'Register.DailyPlan.Amount.Confirm',
    },
});


menu.state('Register.DailyPlan.Amount.Confirm', {
    run: () => {
        menu.con(
            'Make sure you have enough ' +
            'balance to proceed with ' +
            `transaction of GHC ${menu.val}\n` +
            '1. Proceed\n' +
            '0. Exit'
            )
    },
    next: {
        '1': 'Register.DailyPlan.Amount.Confirm.Done',
        '0': 'Exit'
    }
});

menu.state('Register.DailyPlan.Amount.Confirm.Done', {
    run: () => {
        menu.end(
            'Request submitted successfully you will receive a payment ' +
            'Contribution prompt shortly'
            )
    }
});

menu.state('Register.WeeklyPlan', {
    run: () => {
        let message = '';
        weeklyPlans.forEach((element, index) => {
            message += `${(index + 1)}. ${element.name}\n`;
        });
        message+='4. Enter your own amount'
        menu.con( message )
    },
    next: {
        '*[1-3]+': 'Register.WeeklyPlan.PlanSelected',
        '4': 'Register.WeeklyPlan.Amount',
    },
    defaultNext: '__start__'
});

menu.state('Register.WeeklyPlan.PlanSelected', {
    run: () => {

        menu.session.set('weeklyplan_index_selected', menu.val);
        let weekly_plan_selected = weeklyPlans[(Number(menu.val) - 1)];
        menu.con(
            'Make sure you have enough ' +
            'balance to proceed with ' +
            `transaction of GHC ${weekly_plan_selected.amount}\n` +
            '1. Proceed\n' +
            '0. Exit'
            )
    },
    next: {
        '1': 'Register.WeeklyPlan.PlanSelected.Proceed',
        '0': 'Exit',        
    },
    defaultNext: '__start__'
});

menu.state('Register.WeeklyPlan.PlanSelected.Proceed', {
    run: () => {
        menu.end(
            'Request submitted successfully you will ' +
            'receive a payment prompt shortly' 
            )
    },
});

menu.state('Register.WeeklyPlan.Amount', {
    run: () => {
        menu.con(
            'Please enter the amount to contribute'
            )
    },
    next: {
        '*\\d+': 'Register.WeeklyPlan.Amount.Confirm',
    },
});

menu.state('Register.WeeklyPlan.Amount.Confirm', {
    run: () => {
        menu.con(
            'Make sure you have enough ' +
            'balance to proceed with ' +
            `transaction of GHC ${menu.val}\n` +
            '1. Proceed\n' +
            '0. Exit'
            )
    },
    next: {
        '1': 'Register.WeeklyPlan.Amount.Confirm.Done',
        '0': 'Exit'
    }
});

menu.state('Register.WeeklyPlan.Amount.Confirm.Done', {
    run: () => {
        menu.end(
            'Request submitted successfully you will receive a payment ' +
            'Contribution prompt shortly'
            )
    }
});

/** Start monthly plan */

menu.state('Register.MonthlyPlan', {
    run: () => {
        let message = '';
        monthlyPlans.forEach((element, index) => {
            message += `${(index + 1)}. ${element.name}\n`;
        });
        message+='4. Enter your own amount'
        menu.con( message )
    },
    next: {
        '*[1-3]+': 'Register.MonthlyPlan.PlanSelected',
        '4': 'Register.MonthlyPlan.Amount',
    },
    defaultNext: '__start__'
});

menu.state('Register.MonthlyPlan.PlanSelected', {
    run: () => {

        menu.session.set('monthlyplan_index_selected', menu.val);
        let monthly_plan_selected = monthlyPlans[(Number(menu.val) - 1)];
        menu.con(
            'Make sure you have enough ' +
            'balance to proceed with ' +
            `transaction of GHC ${monthly_plan_selected.amount}\n` +
            '1. Proceed\n' +
            '0. Exit'
            )
    },
    next: {
        '1': 'Register.MonthlyPlan.PlanSelected.Proceed',
        '0': 'Exit',        
    },
    defaultNext: '__start__'
});

menu.state('Register.MonthlyPlan.PlanSelected.Proceed', {
    run: () => {
        menu.end(
            'Request submitted successfully you will ' +
            'receive a payment prompt shortly' 
            )
    },
});

menu.state('Register.MonthlyPlan.Amount', {
    run: () => {
        menu.con(
            'Please enter the amount to contribute'
            )
    },
    next: {
        '*\\d+': 'Register.MonthlyPlan.Amount.Confirm',
    },
});

menu.state('Register.MonthlyPlan.Amount.Confirm', {
    run: () => {
        menu.con(
            'Make sure you have enough ' +
            'balance to proceed with ' +
            `transaction of GHC ${menu.val}\n` +
            '1. Proceed\n' +
            '0. Exit'
            )
    },
    next: {
        '1': 'Register.MonthlyPlan.Amount.Confirm.Done',
        '0': 'Exit'
    }
});

menu.state('Register.MonthlyPlan.Amount.Confirm.Done', {
    run: () => {
        menu.end(
            'Request submitted successfully you will receive a payment ' +
            'Contribution prompt shortly'
            )
    }
});
/** End monthly plan */


/** Start register iCare */

menu.state('Register.iCare', {
    run: () => {
        menu.end(
            'iCare Selected'
            )
    }
});
/** End register iCare */

///////////////--------------END REGISTER STATES--------------////////////////


///////////////--------------START CHECKBALANCE STATES--------------////////////////
menu.state('CheckBalance', {
    run: () => {
        menu.end(
            'Dear customer, your auto-debit deduction will be done tomorrow. Ensure that you have enough funds in your ' +
            'wallet for the payment. View your current contribution here: https://peoplespension.global'
            )
    }
});

///////////////--------------END CHECKBALANCE STATES--------------////////////////


///////////////--------------START iCare STATES--------------////////////////
menu.state('iCare', {
    run: () => {
        menu.go('Exit')
    }
});
///////////////--------------END iCare STATES--------------////////////////


///////////////--------------START Topup STATES--------------////////////////
menu.state('Topup', {
    run: () => {
        menu.go('Exit')
    }
});
///////////////--------------END Topup STATES--------------////////////////


///////////////--------------START ChangeStopPlan STATES--------------////////////////
menu.state('ChangeStopPlan', {
    run: () => {
        menu.go('Exit')
    }
});
///////////////--------------END ChangeStopPlan STATES--------------////////////////

///////////////--------------START Withdraw STATES--------------////////////////
menu.state('Withdraw', {
    run: () => {
        menu.go('Exit')
    }
});
///////////////--------------END Withdraw STATES--------------////////////////



///////////////--------------END REGISTER STATES--------------////////////////

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using People\'s Pension Trust.');
    }
})


///////////////--------------PAY ROUTE STARTS--------------////////////////


///////////////--------------ICARE ROUTE STARTS--------------////////////////


///////////////--------------WITHDRAWAL ROUTE STARTS--------------////////////////


/////////////////------------------CONTACT US STARTS------------------/////////////////////
menu.state('Contact', {
    run: async () => {

        await fetchCustomer(menu.args.phoneNumber, async (data) => {
            if (data.active) {

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
exports.ussdApp = async (req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    menu.run(args, ussdResult => {
        if (args.Operator) { menu.session.set('network', args.Operator); }
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


async function postCustomer(val, callback, errorCallback) {
    var api_endpoint = apiurl + 'CreateCustomer/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                // return res;
                return await errorCallback(resp.request.body);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
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
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
            }
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
                // return res;
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
            }
        });
    return true
}

async function fetchIcareCustomer(val, callback) {
    // try {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if (val && val && val.startsWith('233')) {
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getIcare/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                if (response.active) {
                    menu.session.set('name', response.fullname);
                    menu.session.set('mobile', val);
                    // menu.session.set('accounts', response.accounts);
                    // menu.session.set('cust', response);
                    // menu.session.set('pin', response.pin);
                    // menu.session.set('limit', response.result.limit);
                }

                return await callback(response);
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
    } else if (val && val && val.startsWith('233')) {
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                if (response.active) {
                    menu.session.set('name', response.fullname);
                    menu.session.set('mobile', val);
                    menu.session.set('accounts', response.accounts);
                    menu.session.set('cust', response);
                    menu.session.set('pin', response.pin);
                    // menu.session.set('limit', response.result.limit);
                }

                return await callback(response);
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
        .end(async (resp) => {
            if (resp.error) {
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                if (response.balance) {
                    menu.session.set('balance', response.balance);
                }

                return await callback(response);
            }
        });
}

async function postAutoDeposit(val, callback) {
    var api_endpoint = apiurl + 'AutoDebit/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            if (resp.error) {
                return await callback(resp);
            }
            else {
                // if (res.error) throw new Error(res.error); 
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
            }
        });
    return true
}

async function stopAutoDeposit(val, callback) {
    var api_endpoint = apiurl + 'AutoDebit/' + access.code + '/' + access.key;
    var req = unirest('DELETE', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (resp.error) throw new Error(resp.error); 
            if (resp.error) {
                var respons = JSON.parse(resp.raw_body);
                return await callback(respons);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
            }
        });
    return true
}

async function postDeposit(val, callback, errorCallback) {
    var api_endpoint = apiurl + 'Deposit/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp);
            }
            // if (res.error) throw new Error(res.error); 
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
            }
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
            if (resp.error) {
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);

            }
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
            if (resp.error) {
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
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
    } else if (val && val && val.startsWith('233')) {
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomerAccounts/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);

                return await callback(response);
            }
        });
}

async function fetchCustomerAccount(val, callback) {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if (val && val && val.startsWith('233')) {
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomerAccount/' + access.code + '/' + access.key + '/' + val.mobile + '/' + val.index;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // var response = JSON.parse(res);
                // return res;
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);

                return await callback(response);
            }
        });
}


async function filterPersonalSchemeOnly(val, callback) {
    if (val && val && val.startsWith('0')) {
        // Remove Bearer from string
        val = '+233' + val.substr(1);
    } else if (val && val && val.startsWith('233')) {
        val = '+233' + val.substr(3);
    }
    var api_endpoint = apiurl + 'getCustomer/Personal/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                return await callback(resp);
            }
            else {
                var response = JSON.parse(resp.raw_body);
                return await callback(response);
            }
        });
}
