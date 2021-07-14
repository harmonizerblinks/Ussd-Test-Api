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
                    '\n1. Transaction' +
                    '\n2. Approvals' +
                    '\n3. Management'
                    )
            }
        })
    },
    next: {
        '1': 'transaction',
        '2': 'approvals',
        '3': 'management',
    }
})

menu.state('mainmenu', {
    run: async() => {
        await fetchAccount(menu.args.phoneNumber, (data)=> {
            // console.log(data);
            if (data.body.success == true && data.body.result.isPinCreated == false){
                    menu.con('Welcome to [Group Name]' + 
                    '\n1. Transaction' +
                    '\n2. Approvals' +
                    '\n3. Management'
                    )
            }
        })
    },
    next: {
        '1': 'transaction',
        '2': 'approvals',
        '3': 'management',
    }
})



///////////////--------------TRANSACTION ROUTE STARTS--------------////////////////
menu.state('Transaction', {
    run: () => {
        menu.end(`View transactions: [count] - GHS[amount]` + 
        '\n 1. Savings  [count] - GHS[amount]' +
        '\n 2. Withdrawal  [count] - GHS[amount]' +
        '\n 3. Loan Repayment  [count] - GHS[amount]' +
        '\n 4. Pension  [count] - GHS[amount]' 
        )
    }
})

///////////////--------------APPROVALS ROUTE STARTS--------------////////////////
menu.state('approvals', {
    run: () => {
        menu.con(
        '\n1. Withdrawal request' +
        '\n2. Loan request'
        )
    },
    next: {
        '1': 'withdrawal',
        '2': 'loan'
    }
})

///////////////--------------APPROVALS > WITHDRAWAL ROUTE STARTS--------------////////////////
menu.state('withdrawal', {
    run: () => {
        menu.con('Please approve the following withdrawal requests' + 
        '\n1. [GM number], [Number] Shares' +
        '\n2. [GM number], [Number] Shares' +
        '\n\n Press 0 to Approve All except [GM number,.......]'
        )
    },
    next: {
        '0': 'withdrawal.proceed',
    }
})

menu.state('withdrawal.proceed', {
    run: () => {
        menu.end(`You have successfully approved all withdrawals except below:` +
        '\n1. [GM number], [Number] Shares' +
        '\n2. [GM number], [Number] Shares'
        )
    }
})

///////////////--------------APPROVALS > LOAN ROUTE STARTS--------------////////////////
menu.state('loan', {
    run: () => {
        menu.con('Please approve the following loan requests' + 
        '\n1. [GM number], GHS[Amount]' +
        '\n2. [GM number], GHS[Amount]' +
        '\n\n Press 0 to Approve All except [GM number,.......]'
        )
    },
    next: {
        '0': 'loan.proceed',
    }
})



menu.state('loan.proceed', {
    run: () => {
        menu.end(`You have successfully approved all loan except below:` +
        '\n1. [GM number], GHS[Amount]' +
        '\n2. [GM number], GHS[Amount]'
        )
    }
})

///////////////--------------MANAGEMENT ROUTE STARTS--------------////////////////
menu.state('management', {
    run: () => {
        menu.con(
        '\n1. Add members' +
        '\n2. Configures shares' +
        '\n3. Define loan interest' +
        '\n4. Withdrawal limit' +
        '\n5. Loan limit' +
        '\n6. Loan repayment frequency' +
        '\n7. List of shares' +
        '\n8. Attendance' +
        '\n9. Start the cycle' +
        '\n0. Back')
    },
    next: {
        '1': 'management.register',
        '2': 'management.configure',
        '3': 'management.loaninterest',
        '4': 'management.withdrawallimit',
        '5': 'management.loanlimit',
        '6': 'management.loanrepayment',
        '7': 'management.shares',
        '8': 'management.attendance',
        '9': 'management.cycle',
        '0': 'mainmenu'
    }
})

///////////////--------------MANAGEMENT > REGISTER STARTS--------------////////////////
menu.state('management.register', {
    run: () => {
        menu.con('Enter first name')
    },
    next: {
        '*[a-zA-Z]+': 'register.firstname'
    }
})

menu.state('register.firstname', {
    run: () => {
        menu.con('Enter middle name')
    },
    next: {
        '*[a-zA-Z]+': 'register.middle'
    }
})

menu.state('register.middle', {
    run: () => {
        menu.con('Enter last name')
    },
    next: {
        '*[a-zA-Z]+': 'register.momo'
    }
})

menu.state('register.momo', {
    run: () => {
        menu.con('Enter Momo Number')
    },
    next: {
        '^[0-9]*$': 'register.phonenumber'
    }
})

menu.state('register.phonenumber', {
    run: () => {
        menu.con('First name: [xxxxxx]' +
        '\nMiddle name: [xxxxxx]' +
        '\Last name: [xxxxxx]' +
        '\nMomo number: [xxxxxx]' + 
        '\n\n1. Confirm: [xxxxxx]' + 
        '\n0. Main Menu'
        )
    },
    next: {
        '1': 'register.confirm',
        '0': 'mainmenu'
    }
})


menu.state('register.confirm', {
    run: () => {
        menu.end('You have successfully added the member: [xxxxxxx] to group [xxxxxxx]')
    }
})


///////////////--------------CHECK BALANCE ROUTE STARTS--------------////////////////

menu.state('management.configure', {
    run: () => {
        menu.con('Enter the Maximum number of shares per meeting')
    },
    next: {
        '^[0-9]*$': 'configure.proceed'
    }

})

menu.state('configure.proceed', {
    run: () => {
        menu.con('Enter the cost per shares')
    },
    next: {
        '^[0-9]*$': 'configurecost.proceed'
    }

})

menu.state('configurecost.proceed', {
    run: () => {
        menu.end('You have successfully configured the shares' + 
        '\n\n Max number of shares [Number].' +
        '\n Cost per shares GHS [Amount]'
        )
    }
})

///////////////--------------MANAGEMENT > LOAN INTEREST ROUTE STARTS--------------////////////////

menu.state('management.loaninterest', {
    run: () => {
        menu.con('Enter the percentage of the loan interest');
    },
    next: {
        '^[0-9]*$': 'loaninterest.proceed'
    }
})

menu.state('loaninterest.proceed', {
    run: () => {
        menu.end('You have successfully configured the load interest' +
        '\nLoan interest: [number]%'
        )
    }
})

///////////////--------------MANAGEMENT > WITHDRAWAL LIMIT ROUTE STARTS--------------////////////////
menu.state('management.withdrawallimit', {
    run: () => {
        menu.con('Enter the percentage of shares to be withdrawn')
    },
    next: {
        '^[0-9]*$': 'withdrawallimit.proceed'
    }
})

menu.state('withdrawallimit.proceed', {
    run: () => {
        menu.end('You have successfully configured the withdrawal limit' +
        '\nWithdrawal Limit: [number]% of shares'
        )
    }
})

///////////////--------------MANAGEMENT > LOAN LIMIT ROUTE STARTS--------------////////////////
menu.state('management.loanlimit', {
    run: () => {
        menu.con('Enter the percentage of loan limit')
    },
    next: {
        '^[0-9]*$': 'loanlimit.proceed'
    }
})

menu.state('loanlimit.proceed', {
    run: () => {
        menu.end('You have successfully configured the loan limit' +
        '\nLoan Limit: [number]%'
        )
    }
})

///////////////--------------MANAGEMENT > LOAN REPAYMENT ROUTE STARTS--------------////////////////
menu.state('management.loanrepayment', {
    run: () => {
        menu.con('Enter the loan frequency per cycle')
    },
    next: {
        '^[0-9]*$': 'loanrepayment.proceed'
    }
})

menu.state('loanrepayment.proceed', {
    run: () => {
        menu.end('You have successfully configured the loan frequency' +
        '\nLoan frequency: [number] per cycle'
        )
    }
})


///////////////--------------MANAGEMENT > SHARES ROUTE STARTS--------------////////////////
menu.state('management.shares', {
    run: () => {
        menu.end('Actual List of Shares' + 
        '\n1. [GM number], [Number]' +
        '\n2. [GM number], [Number]' +
        '\n3. [GM number], [Number]' +
        '\n4. [GM number], [Number]' +
        '\n5. [GM number], [Number]' +
        '\n6. [GM number], [Number]' 
        )
    }
})


/////////////////------------------MANAGEMENT > ATTENDANCE STARTS------------------/////////////////////
menu.state('management.attendance', {
    run: () => {
        menu.con('Enter the members absent [GM number], [GM number], ...' + 
        '\n1. Proceed',
        '\n0. Main Menu'
        );
    },
    next: {
        '1': 'attendance.proceed',
        '0': 'mainmenu'
    }
})

menu.state('attendance.proceed', {
    run: () => {
        menu.end('You have successfully recorded the absence.' +
        '\nTotal Number of absence: [number]'
        );
    }
});

/////////////////------------------MANAGEMENT > CYCLE STARTS------------------/////////////////////
menu.state('management.cycle', {
    run: () => {
        menu.con('Enter the starting date DD/MM/YYY'
        );
    },
    next: {
        '*[a-zA-Z]+': 'cycle.start',
    }
});

menu.state('cycle.start', {
    run: () => {
        menu.con('Enter the cut off date DD/MM/YYY'
        );
    },
    next: {
        '*[a-zA-Z]+': 'cycle.proceed',
    }
});

menu.state('cycle.proceed', {
    run: () => {
        // Cancel Savings request
        menu.end('You have successfully started the cycle' + 
        '\n Date: [dd/mm/yyyy]'
        );
    }
});


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

