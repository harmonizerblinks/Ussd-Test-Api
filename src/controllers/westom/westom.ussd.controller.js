const UssdMenu = require('ussd-menu-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu();
let sessions = {};
const appKey = '180547238'; const appId = '75318691';
const apiUrl = "https://api.paynowafrica.com";


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


///////////////--------------USSD CODE STARTS--------------////////////////

// menu.startState({
//     run: async() => {
//         await fetchaccount(menu.args.phoneNumber, (data)=> {
//             menu.con('Welcome to Ahantaman Rural Bank. Please create a PIN before continuing' + '\nEnter 4 digits.')
//         });
//     },
//     next: {
//         '*\\d+': 'user.pin'
//     }
// })

menu.state('user.pin',{
    run: () => {
        let pin = menu.val;
        menu.session.set('pin', pin);
        menu.con('Re-enter the 4 digits')
    },
    next: {
        '*\\d+': 'user.verifypin'
    }
})

menu.state('user.verifypin',{
    run: async() => {
        var vpin = Number(menu.val);
        var pin = await menu.session.get('pin');
        if(vpin == pin) {
            await createpin(menu.args.phoneNumber, (data) => {
                if (data.body.statusmessage == 'Success'){
                    menu.con('Thank you for successfully creating a PIN. Enter zero(0) to continue')
                }else{
                    menu.end('Something went wrong. Please contact Admin.')
                }

            })
        }else{
            menu.con('Enter zero(0) to create PIN again')
        }
    },
    next: {
        '0': 'mainmenu',
    }
})

///////////////--------------MENU STARTS--------------////////////////

menu.startState({
    run: () => {
        //await fetchaccount(menu.args.phoneNumber, (data)=> {
            // if(data.body[0].hpin == 'false'){
            //     menu.con('Welcome to Ahantaman Rural Bank. Please create a PIN before continuing' + '\n\nEnter 4 digits.')
            // }else{
        menu.con(`Welcome to WiB broker,
        1. Buy Insurance
        2. Customer Service
        3. Savings
        4. Claims
        5. Agent
        `)
            // }
    //    });
    },
    next: {
        '1': 'insurance',
        '2': 'customerservice',
        '3': 'savings',
        '4': 'claims',
        '5': 'agent'

    }
})

menu.state('mainmenu', {
    run: () => {
        menu.con(`Welcome to WiB broker,
        1. Buy Insurance
        2. Customer Service
        3. Savings
        4. Claims
        5. Agent
        `)
        // }
        //    });
    },
    next: {
        '1': 'insurance',
        '2': 'customerservice',
        '3': 'savings',
        '4': 'claims',
        '5': 'agent'
    }
})



///////////////--------------INSURANCE STARTS--------------////////////////

menu.state('insurance',{
    run: () => {
        menu.con('Insurance:' +
        '\n1. Daily' +
        '\n2. Weekly' +
        '\n3. Monthly'
        )
    },
    next: {
        '1': 'daily',
        '2': 'weekly',
        '3': 'monthly'
    }
})

menu.state('daily', {
    run: () => {
        menu.con('Daily:' +
            '\n1. 1 cedi per day' +
            '\n2. 2 cedi per day' +
            '\n3. 3 cedi per day'
        )
    },
    next: {
        '*\\d+': 'confirm',
    }
})

menu.state('weekly', {
    run: () => {
        menu.con('Weekly:'+
            '\n1. 3 cedi per week' +
            '\n2. 5 cedi per week' +
            '\n3. 10 cedi per week'
        )
    },
    next: {
        '*\\d+': 'confirm',
    }
})


menu.state('monthly', {
    run: () => {
        menu.con('Monthly: ' +
            '\n1. 3 cedi per week' +
            '\n2. 5 cedi per week' +
            '\n3. 30 cedi per week' +
            '\n4. 50 cedi per week'
        )
    },
    next: {
        '*\\d+': 'confirm',
    }
})



menu.state('confirm',{
    run: () => {
        menu.end('An authorization message has been sent to your phone. Please complete the purchase by approving with your MoMo PIN')
    }
})



///////////////--------------CUSTOMER SERVICE STARTS--------------////////////////

menu.state('customerservice', {
    run: () => {
        menu.end('Customer Service' +
        '\nCall Customer Care: ' +
        '\n0302266682, 0245310258(All Networks)'
        )
    }
})

///////////////--------------CLAIMS STARTS--------------////////////////

menu.state('claims', {
    run: () => {
        menu.end('You will be contacted shortly.')
    }
})


///////////////--------------SAVINGS STARTS--------------////////////////
menu.state('savings', {
    run: () => {
        menu.end('Your savings amount is GHS 8.00')
    }
})

///////////////--------------AGENTS STARTS--------------////////////////
menu.state('agent', {
    run: () => {
        menu.con(`Agents:
        1. Buy Insurance
        2. Subscribe
        3. Savings
        `)
    },
    next: {
        '1': 'insurance',
        '2': 'subscribe',
        '3': 'savings',
    }
})

menu.state('subscribe', {
    run: () => {
        menu.con(`Subscribe:
        Enter number of subscriber
        `)
    },
    next: {
        '*\\d+': 'verify',
    }
})

menu.state('verify', {
    run: () => {
        menu.con(`Your registration was successful. Press 0 to return to the main menu
        `)
    },
    next: {
        '0': 'mainmenu',
    }
})

//////////-------------START SESSION FUNCTION--------------//////////////
module.exports.startSession = (req, res) => {
    menu.run(req.body, ussdResult => {
        res.send(ussdResult);
        menu.session.get('network', req.body.networkCode)
    });
}

async function fetchaccount (val, callback) {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233','233');
    }

    let data = {
        code: '303',
        key: '303',
        mobile: val
    }

    // console.log(data);

    var request = unirest('GET', `${apiUrl}/PayNow/Customer/${data.code}/${data.key}/${data.mobile}`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        // .send(JSON.stringify(data))
        .then(async (response) => {
                menu.session.set('accountinfo', response.body);
                // console.log(response.body)
            await callback(response);
        })
}

async function createpin (val, callback) {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233','233');
    }

    let data = {
        appId: appId,
        appKey: appKey,
        mobile: val,
        pin: await menu.session.get('pin')
    }

    // console.log(data);

    var request = unirest('POST', `${apiUrl}/createPin`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(data))
        .then(async (response) => {
                // menu.session.set('accountinfo', response);
                console.log(response.body)
            await callback(response);
        })
}

async function payment (data, callback) {

    var request = unirest('POST', `${apiUrl}/PayNow/Merchant`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        .send(JSON.stringify(data))
        .then(async (response) => {
                // menu.session.set('accountinfo', response);
                console.log(response.body)
            await callback(response);
        })
}
