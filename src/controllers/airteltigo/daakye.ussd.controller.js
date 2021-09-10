const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
let genderArray = ["", "Male", "Female"];
var numbers = /^[0-9]+$/;


// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api.alias-solutions.net:8444/MiddlewareApi/ussd/";
let apiurl = "https://app.alias-solutions.net:5010/ussd/";

// let access = { code: "ARB", key: "10198553" };
let access = { code: "ACU001", key: "1029398" };

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
                menu.con('Welcome to Daakye Personal SUSU ' +
                    '\n1. Savings' +
                    '\n2. Withdrawal' +
                    '\n3. Loan Request' +
                    '\n4. Loan Repayment' +
                    '\n5. My Account'
                    );
             
    },
    // next object links to next state based on user input
    next: {
        '1': 'Savings',
        '2': 'Withdrawal',
        '3': 'Loan Request',
        '4': 'Loan Repayment',
        '5': 'My Account'
    }
}); 

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using Daakye Personal Susu.')
    }
})

//////////////////////////////////////////////////////////////////////////////////////
   

//////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////////////
 

//////////////////////////////////////////////////////////////////////////////////////
  

// Daakye USSD
exports.ussdApp = async (req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    // console.log(args);
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

     