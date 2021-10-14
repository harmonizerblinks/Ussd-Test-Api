const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'hubtel'});
var unirest = require('unirest');
let sessions = {};

//Test Credentials
let apiurl = "https://app.alias-solutions.net:5008/ussd/";
let access = { code: "446785909", key: "164383692" };

// Live Credentials
// let apiurl = "https://app.alias-solutions.net:5009/ussd/";
// let access = { code: "PPT", key: "178116723" };

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
        menu.con('Welcome to PPT Occupational Pension scheme. Enter Company Name')
    },
    // next object links to next state based on user input
    next: {
        '*[a-zA-z]+': 'Company'
    }
});

menu.state('Company', {
    run: () => {
        let company = menu.val;
        menu.session.set('name', company)
        menu.con('How much would you like to pay?')
    },
    next: {
        '*\\d+': 'Company.Amount'
    },
    defaultNext: 'IncorrectInput'
})

menu.state('Company.Amount', {
    run: () => {
        let the_amount = Number(menu.val);
        menu.session.set('company_amount', the_amount)
        menu.con(`Make sure you have enough balance to proceed with transaction of GHS ${the_amount}\n` +
        `1. Proceed\n` +
        `0. Exit\n`
        );
    },
    next: {
        '1': 'Company.Amount.Proceed',
        '0': 'Exit'
    },
    defaultNext: 'IncorrectInput'
})

menu.state('Company.Amount.Proceed', {
    run: () => {
        menu.end(`Request submitted\nYou should receive a payment prompt shortly`
        );
    },
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