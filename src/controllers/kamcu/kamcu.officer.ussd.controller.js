const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
// let apiurl = "http://localhost:5000/Ussd/";
// let apiurl = "https://api-maximus.paynowafrica.com/ussd/";
let apiurl = "https://app.alias-solutions.net:5003/ussd/";
let regex = /^[a-zA-Z ]*$/;

let access = { code: "KCU006", key: "60198553" };

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
    run: async() => {
        // Fetch Customer information
        await fetchOfficer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data);
            if(data && data.active) { 
                menu.session.set('officer', data);
                menu.session.set('pin', data.pin);
                menu.con('Welcome to KAMCU Agent Collections' + 
                    '\nEnter Member Account Number.');
            } else {
                menu.end('You are not a Field Officer');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '*[0-9]+': 'Deposit'
    }
});

menu.state('Start', {
    run: async() => {
        // Fetch Customer information
        await fetchOfficer(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data);
            if(data.active) { 
                menu.session.set('officer', data);
                menu.session.set('pin', data.pin);
                menu.con('Welcome to KAMCU Agent Collections' + 
                    '\nEnter Member Account Number.');
            } else {
                menu.end('You are not a Field Officer');
            }
        });
    },
    // next object links to next state based on user input
    next: {
        '*[0-9]+': 'Deposit'
    },
    defaultNext: 'Start'
});

menu.state('Deposit', {
    run: async() => {
        await fetchAccount(menu.val, (data)=> { 
            if(data.active) {
                menu.session.set('account', data)
                menu.con('You are making a payment for ' + data.fullname +'. How much would you like to pay?')
            } else {
                menu.end('Account not Registered. Please try again');
            }
        });
    },
    next: {
        '0': 'Start',
        '*\\d+': 'Deposit.view'
    },
    defaultNext: 'Deposit.view'
});


menu.state('Deposit.view', {
    run: async() => {
        let acct = menu.session.get('account');
        if(acct === null) menu.end("Invalid input");
        let amount = menu.val;
        menu.session.set('amount', amount);
        menu.con(`Make sure you have enough wallet balance to proceed with transaction of GHS ${amount} ` +
        '\n1. Proceed' +
        '\n0. Exit'
        )
    },
    next: {
        '0': 'Deposit.cancel',
        '1': 'Deposit.send',
    }
})

menu.state('Deposit.send', {
    run: async() => {
        // access user input value save in session
        var of = await menu.session.get('officer');
        var amount = await menu.session.get('amount');
        var account = await menu.session.get('account');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        var data = { account:account.code,network:network,mobile:mobile,amount:amount,method:'MOMO',source:'USSD',reference:'Deposit', officerid: of.officerid};
        // console.log(data);
        await postDeposit(data, async(result)=> { 
            console.log(result.message) 
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Request submitted successfully. You will receive a payment prompt shortly')
    }
});

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


function buyAirtime(phone, val) {
    return true
}

async function fetchOfficer(val, callback) {
    // try {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233','0');
        }
        else if(val & val.startsWith('233'))
        {
            // Remove Bearer from string
            val = val.replace('233','0');
        }
        var api_endpoint = apiurl + 'getOfficer/' + access.code + '/'+ access.key + '/'+ val;
        // console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            if (resp.error) { 
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            var response = JSON.parse(resp.raw_body);
            await callback(response);
        });
}


async function fetchAccount(val, callback) {
    
    var api_endpoint = apiurl + 'getAccount/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error);
            // var response = JSON.parse(res);
            // return res;
            await callback(resp);
        }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        
        await callback(response);
    });
}

async function postDeposit(val, callback) {
    var api_endpoint = apiurl + 'Agent/Deposit/' + access.code + '/' + access.key;
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(resp)=> { 
        // console.log(JSON.stringify(val));
        if (resp.error) { 
            console.log(resp.error);
            // await postDeposit(val);
            await callback(resp);
        }
        // if (res.error) throw new Error(res.error); 
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
    return true
}
