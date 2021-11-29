const UssdMenu = require('ussd-builder');
const unirest = require('unirest');
var generator = require('generate-serial-number');
let menu = new UssdMenu({ provider: 'hubtel' });
let sessions = {};
const appKey = '062262554'; const appId = '052683438';
// const apiUrl = "https://app.alias-solutions.net:50033/Ussd/";
var apiUrl = 'https://api-aslans.paynowafrica.com/api/services/app/';
const bcrypt = require('bcryptjs');
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
});



///////////////--------------MENU STARTS--------------////////////////

menu.startState({
    run: async() => {
        await fetchAccount(menu.args.phoneNumber, (data)=> {
            // console.log(data);
            if (data && data.body && data.body.success == true && data.body.result.isPinCreated == false){
                    menu.con('Welcome to ' + data.body.groups + '.' +'\n '+ data.body.name + 
                    '\n1. Savings / Shares' +
                    '\n2. Withdrawal' +
                    '\n3. Loan Request' +
                    '\n4. Loan Repayment' +
                    '\n5. Other' +
                    '\n6. Payment on behalf' +
                    '\n7. Exit'
                    )
            }
            else {
                menu.con('Enter the number you were signed up with');
            }
        })
    },
    next: {
        '1': 'savings/shares',
        '2': 'withdrawal',
        '3': 'loanrequest',
        '4': 'loanrepayment',
        '5': 'other',
        '6': 'paymentonbehalf',
        '7': 'Exit',
        '*[0-9]+': 'Number.account'
    }
})

///////////////--------------SHARES ROUTE STARTS--------------////////////////
menu.state('savings/shares', {
    run: async () => {
        var rate = await menu.session.get('rate');
        if(rate == null) {
            await fetchAccount(menu.args.phoneNumber, (data)=> { 
                // console.log(1,data); 
                // use menu.con() to send response without terminating session 
                if(data.success) {     
                    menu.con('Enter amount to Save ' +
                        '\n Daily Rate GHC ' + data.result.rate);
                } else {
                    // `menu.go('Number');
                    menu.con('Incorrect Live Time Number' + 
                    '\n Enter the number you were sign up with');
                }
            });
        } else {
        menu.con('Enter amount to Save ' +
            '\n Daily Rate GHC ' + rate);
        }
    },
    next: {
        '*\\d+': 'shares.number'
    }
})

menu.state('shares.number', {
    run: async () => {
         // use menu.val to access user input value
         var amount = Number(menu.val);
         var rate = await menu.session.get('rate');
         var val = amount/rate;
         if(Number.isInteger(val)) {
             // save user input in session
             menu.session.set('amount', amount);
             menu.con('You want to perform saving of amount GHC ' + amount +
                 '\n1. Confirm' +
                 '\n2. Cancel');
         } else {
             menu.con('You can only pay in multiple of amount GHC ' + rate +
                 '\n*. Try Again' +
                 '\n2. Cancel');
         }
    },
    next: {
        '1': 'shares.confirm',
        '2': 'cancel',
        '*': 'savings/shares'
    }
})

menu.state('shares.confirm', {
    run: async () => {
        
        // access user input value save in session
        var name = await menu.session.get('name');
        var group = await menu.session.get('group');
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var accountid = await menu.session.get('accountid');
        var groupid = await menu.session.get('groupid');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {account: account,type:'Deposit',groupid:groupid,accountid:accountid,network:network,mobile: mobile,amount: amount,withdrawal:false, reference: group+' '+name};
        await postPayment(data, async(result)=> { 
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone.');
    },
    next: {
        '^[0-9]*$': 'shares.success'
    }
})


///////////////--------------WITHDRAWAL ROUTE STARTS--------------////////////////
menu.state('withdrawal', {
    run: () => {
        menu.con('Enter Number of Shares')
    },
    next: {
        '^[0-9]*$': 'withdrawal.number'
    }
})

menu.state('withdrawal.number', {
    run: () => {
        menu.con('[Username] is about to make a withdrawal of GHS [Amount]' +
        '\n1. Proceed' +
        '\n2. Cancel')
    },
    next: {
        '1': 'withdrawal.proceed',
        '2': 'cancel'
    }
})

menu.state('withdrawal.proceed', {
    run: () => {
        menu.end('Your withdrawal was not approved, please contact your Group Leads')
    }
})

///////////////--------------LOAN REQUEST ROUTE STARTS--------------////////////////
menu.state('loanrequest', {
    run: () => {
        menu.con('Enter Amount')
    },
    next: {
        '^[0-9]*$': 'loanrequest.proceed',
    }
})

menu.state('loanrequest.proceed', {
    run: () => {
        menu.end('Your loan was not approved, please contact your Group Leads')
    }
})

///////////////--------------LOAN REPAYMENT ROUTE STARTS--------------////////////////
menu.state('loanrepayment', {
    run: () => {
        menu.con('Enter Amount')
    },
    next: {
        '^[0-9]*$': 'loanrepayment.proceed',
    }
})

menu.state('loanrepayment.proceed', {
    run: () => {
        menu.con('[Username] is making a payment of GHS [Amount] to [Group Name]' +
        '\n1. Confirm' +
        '\n2. Cancel')
    },
    next: {
        '1': 'loanrepayment.proceed',
        '2': 'cancel'
    }
})

menu.state('loanrepayment.proceed', {
    run: () => {
        menu.con('Confirm Payment Amount with MM Pin')
    },
    next: {
        '^[0-9]*$': 'loanrepayment.success'
    }
})

menu.state('loanrepayment.success', {
    run: () => {
        menu.end('You have successfully paid [Amount] to [Group Name]')
    }
})

///////////////--------------OTHER ROUTE STARTS--------------////////////////
menu.state('other', {
    run: () => {
        menu.con(
        '\n1. Pension' +
        '\n2. Shares Balance' +
        '\n0. Back')
    },
    next: {
        '1': 'other.pension',
        '2': 'other.shares',
        '0': '__start__'
    }
})

///////////////--------------OTHER > PENSION STARTS--------------////////////////
menu.state('other.pension', {
    run: () => {
        menu.con('Enter Amount')
    },
    next: {
        '^[0-9]*$': 'pension.proceed',
    }
})

menu.state('pension.proceed', {
    run: () => {
        menu.con('[Username] is making a payment of GHS [Amount] to [Pension Company]' +
        '\n1. Confirm' +
        '\n2. Cancel')
    },
    next: {
        '1': 'pension.proceed',
        '2': 'cancel'
    }
})

menu.state('pension.proceed', {
    run: () => {
        menu.con('Confirm Payment Amount with MM Pin')
    },
    next: {
        '^[0-9]*$': 'pension.success'
    }
})

menu.state('pension.success', {
    run: () => {
        menu.end('You have successfully paid [Amount] to [Pension Company]')
    }
})


///////////////--------------OTHER > SHARES BALANCE ROUTE STARTS--------------////////////////

menu.state('other.shares', {
    run: () => {
        menu.con('Enter PIN')
    },
    next: {
        '^[0-9]*$': 'othershares.proceed'
    }

})

menu.state('othershares.proceed', {
    run: () => {
        menu.con('You have [Shares Number] Shares for Amount of GHS [Balance]' +
        '\n0. Main Menu')
    },
    next: {
        '0': '__start__'
    }
})

//Number states

menu.state('Number', {
    run: () => {
        console.log(menu.args);
        menu.end('use the number use were signed up with');
    },
    next: {
        // using regex to match user input to next state
        '*[0-9]+': 'Number.account'
    }
});

// nesting states
menu.state('Number.account', {
    run: async() => {
        // use menu.val to access user input value
        var account = menu.val;
        // save user input in session
        await fetchAccount(account, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.success) {     
                menu.con('Welcome to '+data.result.groups+'.' +'\n '+ data.result.name + 
                    '\n Select a Service:' +
                    '\n1. Savings' +
                    '\n2. Loan',
                    '\n3. Check Balance' +
                    '\n4. Withdrawal' +
                    '\n5. Pay On Behalf' +
                    '\n6. Others');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Live Time Number' + 
                '\n Enter the number you were sign up with');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '1': 'Savings',
        '2': 'Loan',
        '3': 'checkBalance',
        '4': 'Withdrawal',
        '5': 'SaveOnBehalf',
        '6': 'Others',
        '*[0-9]+': 'Number.account'
    }
});

//cancel
menu.state('cancel', {
    run: () => {
        menu.end('Thank you for using our service');
    },
});
/////////////////------------------USSD SESSION STARTS------------------/////////////////////
// module.exports.startUssd = (req, res) => {
// menu.run(req.body, ussdResult => {
//         res.send(ussdResult);
//         // fetchAccount(req.body.phoneNumber);
//     })
// }


/////////////////------------------USSD SESSION STARTS------------------/////////////////////
exports.ussdApp = async (req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    await menu.run(args, async (ussdResult) => {
        // if (args.Operator) { menu.session.set('network', args.Operator); }
        res.send(ussdResult);
    });
};

//////////////////-----FUNCTIONS BEGIN----------------/////////////////////
async function payment(){
    var scheme = await menu.session.get('schemenumber');

    var data = {
        appId: appId,
        appKey: appKey,
        schemeNumber: scheme.schemeNumber,
        amount: await menu.session.get('amount'),
        type: "CONTRIBUTION",
        payerMobile: menu.args.phoneNumber,
        payeeMobile: menu.args.phoneNumber,
        payerNetwork: "mtn",
        payeeNetwork: "mtn",
        name: await menu.session.get('name'),
        currency: "GHS",
        orderId: generator.generate(7),
        orderDesc: "CONTRIBUTION",
        transRefNo: "212121",
        channel: "USSD",
        menuItem: "Register"
    }

    var request = unirest('POST', `${apiUrl}/payment`)
    .headers({
        'Content-Type': ['application/json', 'application/json']
    })
    .send(JSON.stringify(data))
    .then((res) => {
        console.log(res.body);
        menu.end('Request submitted successfully. You will receive a payment prompt shortly');
    })

}

async function tier2payment(){
    var scheme = await menu.session.get('schemenumber');

    var data = {
        appId: appId,
        appKey: appKey,
        schemeNumber: scheme.schemeNumber,
        amount: await menu.session.get('tier2amount'),
        type: "CONTRIBUTION",
        payerMobile: menu.args.phoneNumber,
        payeeMobile: menu.args.phoneNumber,
        payerNetwork: "mtn",
        payeeNetwork: "mtn",
        name: await menu.session.get('companyname'),
        currency: "GHS",
        orderId: generator.generate(7),
        orderDesc: "CONTRIBUTION",
        transRefNo: "212121",
        channel: "USSD",
        menuItem: "Tier 2"
    }

    var request = unirest('POST', `${apiUrl}/payment`)
    .headers({
        'Content-Type': ['application/json', 'application/json']
    })
    .send(JSON.stringify(data))
    .then((res) => {
        console.log(res.body);
        menu.end('Request submitted successfully. You will receive a payment prompt shortly');
    })

}

async function trimesterpayment(){
    var scheme = await menu.session.get('schemenumber');

    var data = {
        appId: appId,
        appKey: appKey,
        schemeNumber: scheme.schemeNumber,
        amount: await menu.session.get('tier2amount'),
        type: "CONTRIBUTION",
        payerMobile: menu.args.phoneNumber,
        payeeMobile: menu.args.phoneNumber,
        payerNetwork: "mtn",
        payeeNetwork: "mtn",
        name: await menu.session.get('companyname'),
        currency: "GHS",
        orderId: generator.generate(7),
        orderDesc: "CONTRIBUTION",
        transRefNo: "212121",
        channel: "USSD",
        menuItem: "Tier 2"
    }

    var request = unirest('POST', `${apiUrl}/payment`)
    .headers({
        'Content-Type': ['application/json', 'application/json']
    })
    .send(JSON.stringify(data))
    .then((res) => {
        console.log(res.body);
        menu.end('Request submitted successfully. You will receive a payment prompt shortly');
    })

}

async function fetchAccount (val, callback){
    let data = {
        appId: appId,
        appKey: appKey,
        mobile: val
    }

    var request = unirest('POST', `${apiUrl}/memberInfo/${appId}/${appKey}`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(data))
        .then(async (response) => {
            // console.log(response.body.result.memberName)
            if (response && response.body && response.body.success && response.body.success == true){
                menu.session.set('name', response.body.result.memberName);
                menu.session.set('schemes', response.body.result.schemes);
                menu.session.set('mobile', response.body.result.mobile);
                
            }
            return await callback(response);
        })

        
}

async function register(){
    let args = {
        appId: appId,
        appKey: appKey,
        payerMobile: menu.args.phoneNumber,
        payeeMobile: await menu.session.get('icaremobile'),
        payerNetwork: "mtn",
        payeeNetwork: "mtn",
        name: await menu.session.get('icarename'),
        channel: "USSD",
        menuItem: "Register",
    }

    var request = unirest('POST', `${apiUrl}/Register`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(args))
        .then((response) => {
            console.log(response.body);
            // menu.session.set('icarename', response.body.result.memberName);
            // menu.session.set('schemenumber', response.body.result.schemes[0].schemeNumber);  
            // menu.session.set('schemetype', response.body.result.schemes[0].schemeType);
            // menu.session.set('icaremobile', response.body.result.mobile);

            menu.con(`Dear ${args.name}, you have successfully register for the Peoples Pension Trust` + 
            '\nWould you like to continue with payment?' +
            '\n0. Exit' +
            '\n1. Pay')
    
          })
};


async function checkbalance(){
    fetchAccount(menu.args.phoneNumber);
    var scheme = await menu.session.get('schemenumber');

    let args = {
        appId: appId,
        appKey: appKey,
        schemeNumber: scheme.schemeNumber,
        pin: await menu.session.get('pin')
    }
    console.log(args)

    var request = unirest('POST', `${apiUrl}/checkbalance`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(args))
        .then((response) => {
            console.log(response);
            menu.end('Your balance details: ' + `\n1. Retirement Balance - [Amount]` + `\n2. Savings Balance - [Amount]`)
    
          })

}

async function createPin(){
    let args = {
        appId: appId,
        appKey: appKey,
        mobile: menu.args.phoneNumber,
        pin: await menu.session.get('pin'),
    }

    var request = unirest('POST', `${apiUrl}/createPin`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(args))
        .then((response) => {
            console.log(response);
            if(response.body.success == false){
                menu.end(`${response.body.error.message}`);
            }else{
                menu.end('Your Pin has been created successfully')
        }
        })
}


async function postPayment(val, callback) {
    var api_endpoint = apiurl + `Mobile/PostPayments/${appId}/${appKey}`;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({agent:null,account:val.account,accountId:val.accountid,type:val.type,method:'MOMO',network:val.network,mobile:val.mobile,source:'USSD',groupid:val.groupid,amount:val.amount,reference:val.reference || 'Group Save',tenantId:tenant,withdrawal:val.withdrawal}))
    .end( async(res)=> { 
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        return await callback(response);
    });
    return true
}



async function fetchMemberAccount(val, callback) {
    // try {
        var api_endpoint = apiurl + `Ussd/GetAccount/${appId}/${appKey}?id=${val.id}&gid=${val.gid}`;
        // console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            // if (resp.error) { 
            //     console.log(resp.error); 
            //     // var response = JSON.parse(res); 
            //     return res;
            // }
            var response = JSON.parse(resp.raw_body);
            if(response.result)
            {
                menu.session.set('name', response.result.name);
                menu.session.set('account', val);
                menu.session.set('rate', response.result.rate);
                menu.session.set('type', response.result.type);
                menu.session.set('accountid', response.result.id);
                menu.session.set('groupid', response.result.groupId);
                menu.session.set('pin', response.result.pin);
                menu.session.set('group', response.result.groups);
                // menu.session.set('grouptype', response.result.groupType);
                menu.session.set('balance', response.result.balance);
                menu.session.set('loan', response.result.loan);
                menu.session.set('institution', response.result.tenant);
                // menu.session.set('limit', response.result.limit);
            }
            
            return await callback(response);
        });
    // }
    // catch(err) {
    //     console.log(err);
    //     return err;
    // }
}