const UssdMenu = require('ussd-menu-builder');
const unirest = require('unirest');
var generator = require('generate-serial-number');
let menu = new UssdMenu();
let sessions = {};
const appKey = '062262554'; const appId = '052683438';
const apiUrl = "https://api.alias-solutions.net:8446/api/services/app/Channels";

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
            if (data.body.success == true && data.body.result.isPinCreated == false){
                    menu.con('Welcome to [Group Name]' + 
                    '\n1. Savings / Shares' +
                    '\n2. Withdrawal' +
                    '\n3. Loan Request' +
                    '\n4. Loan Repayment' +
                    '\n5. Other' +
                    '\n6. Payment on behalf' +
                    '\n7. Exit'
                    )
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
    }
})

menu.state('mainmenu', {
    run: async() => {
        await fetchAccount(menu.args.phoneNumber, (data)=> {
            // console.log(data);
            if (data.body.success == true && data.body.result.isPinCreated == false){
                    menu.con('Welcome to [Group Name]' + 
                    '\n1. Savings / Shares' +
                    '\n2. Withdrawal' +
                    '\n3. Loan Request' +
                    '\n4. Loan Repayment' +
                    '\n5. Other' +
                    '\n6. Payment on behalf' +
                    '\n7. Exit'
                    )
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
    }
})



///////////////--------------SHARES ROUTE STARTS--------------////////////////
menu.state('savings/shares', {
    run: () => {
        menu.con('Enter Number of Shares')
    },
    next: {
        '^[0-9]*$': 'shares.number'
    }
})

menu.state('shares.number', {
    run: () => {
        menu.con('[Username] is making a payment of GHS [Amount] for [Shares Number] Shares to [Group Name]' +
        '\n1. Confirm' +
        '\n2. Cancel')
    },
    next: {
        '1': 'shares.proceed',
        '2': 'cancel'
    }
})

menu.state('shares.proceed', {
    run: () => {
        menu.con('Confirm Payment Amount with MM Pin')
    },
    next: {
        '^[0-9]*$': 'shares.success'
    }
})

menu.state('shares.success', {
    run: () => {
        menu.end('You have successfully paid [Amount] for [Number] Shares to [Group Name]')
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
        '0': 'mainmenu'
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
        '0': 'mainmenu'
    }
})


/////////////////------------------USSD SESSION STARTS------------------/////////////////////
module.exports.startUssd = (req, res) => {
menu.run(req.body, ussdResult => {
        res.send(ussdResult);
        // fetchAccount(req.body.phoneNumber);
    })
}


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

    var request = unirest('POST', `${apiUrl}/memberInfo`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(data))
        .then(async (response) => {
            // console.log(response.body.result.memberName)
            if (response.body.success == true){
                menu.session.set('name', response.body.result.memberName);
                menu.session.set('schemes', response.body.result.schemes);
                menu.session.set('mobile', response.body.result.mobile);
                
            }
            await callback(response);
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

