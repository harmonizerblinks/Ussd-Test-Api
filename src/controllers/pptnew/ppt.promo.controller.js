const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'hubtel'});
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

// Test Credentials
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
        menu.con(
            'Welcome to People\'s Pension Trust\n' +
            'Referral program\n' +
            'Enter referee\'s phone number/referral code'
            )
    },
    // next object links to next state based on user input
    next: {
        '*[a-zA-z0-9]+': 'ReferralCode'
    }
});

menu.state('ReferralCode', {
    run: () => {
        let referral_code = menu.val;
        menu.session.set('referral_code', referral_code)
        menu.end('Dear customer, you were referred by another customer\nChoose a plan\n1.Daily plan\n2.Weekly plan\n3.Monthly plan\n4.Make a payment')
    },
    next: {
        '*[1-3]': 'ReferralCode.Plan'
    },
    defaultNext: 'IncorrectInput'
})

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using our service');
    }
})

menu.state('IncorrectInput', {
    run: () => {
        menu.end('Sorry, incorrect input entered')
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
};