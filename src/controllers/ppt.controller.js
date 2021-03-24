const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
let sessions = {};

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

// Define menu states

menu.startState({
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Welcome to Peoples Pension Trust . Select Desired Option:' +
            '\n1. Pension' +
            '\n2. Withdrawal' +
            '\n3. Check Balance' +
            '\n4. iCare (Pay for someone)' +
            '\n5. Change PIN');
    },
    // next object links to next state based on user input
    next: {
        '1': 'pension',
        '2': 'withdrawal',
        '3': 'checkBalance',
        '4': 'icare',
        '5': 'changePin'
    }
});

/////////////////----------------PENSION ROUTE-------------------///////////////////////
 
menu.state('pension', {
    run: () => {
        menu.con('How much would you like to pay:');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'pension.amount'
    }
});
 
menu.state('pension.amount', {
    run: () => {
        menu.con('Authorize payment of GH [pention.amount] + to [accountnumber]. Enter MM PIN to confirm');
    },
    next: {
        '*\\d+': 'pension.pin'
    }
});
 
menu.state('pension.pin', {
    run: () => {
        var amount = Number(menu.val);
        pensionPin(menu.args.phoneNumber, amount).then(function(res){
            menu.end('You have successfully paid GH[amount] to [account].');
        });
    }
});

/////////////////----------------END PENSION ROUTE-------------------///////////////////////

/////////////////----------------WITHDRAWAL ROUTE-------------------///////////////////////
 
menu.state('withdrawal', {
    run: () => {
        menu.con('Enter Withdrawal Amount');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'withdrawal.amount'
    }
});
 
menu.state('withdrawal.amount', {
    run: () => {
        menu.con('Confirm withdrawal of GH[amount]. Enter PIN to continue');
    },
    next: {
        '*\\d+': 'withdrawal.pin'
    }
});
 
menu.state('withdrawal.pin', {
    run: () => {
        var amount = Number(menu.val);
        withdrawalPin(menu.args.phoneNumber, amount).then(function(res){
            menu.end('Amount is transferred to member MM wallet.');
        });
    }
});

/////////////////----------------END WITHDRAWAL ROUTE-------------------///////////////////////

/////////////////----------------CHECK BALANCE ROUTE-------------------///////////////////////
 
menu.state('withdrawal', {
    run: () => {
        menu.con('Enter Withdrawal Amount');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'withdrawal.amount'
    }
});
 
menu.state('withdrawal.amount', {
    run: () => {
        menu.con('Confirm withdrawal of GH[amount]. Enter PIN to continue');
    },
    next: {
        '*\\d+': 'withdrawal.pin'
    }
});
 
menu.state('withdrawal.pin', {
    run: () => {
        var amount = Number(menu.val);
        withdrawalPin(menu.args.phoneNumber, amount).then(function(res){
            menu.end('Amount is transferred to member MM wallet.');
        });
    }
});

/////////////////----------------END CHECK BALANCE ROUTE-------------------///////////////////////

/////////////////----------------ICARE ROUTE-------------------///////////////////////
 
menu.state('icare', {
    run: () => {
        menu.con('Enter mobile number of receipient:')
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'icare.number',
    }
});

menu.state('icare.number', {
    run: () => {
        menu.con('Confirm payment to [Receipient Number]:' +
        '\n1. Yes' +
        '\n2. No')
    },
    next: {
        // using regex to match user input to next state
        '1': 'icare.yes',
        '2': 'icare'
    }
});

menu.state('icare.yes', {
    run: () => {
        menu.con('How much would you like to pay for [Receipient Name]:')
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'icare.amount',
    }
});

menu.state('icare.amount', {
    run: () => {
        menu.con('Confirm payment of GH[amount]. Enter PIN to continue');
    },
    next: {
        '*\\d+': 'icare.pin'
    }
});

menu.state('icare.pin', {
    run: () => {
        var amount = Number(menu.val);
        withdrawalPin(menu.args.phoneNumber, amount).then(function(res){
            menu.end('You have successfully payed for [Receipient Name]. You will receive and SMS with your receipt shortly.');
        });
    }
});

 

/////////////////----------------END ICARE ROUTE-------------------///////////////////////

/////////////////----------------CHANGE PIN ROUTE-------------------///////////////////////
 
menu.state('changePin', {
    run: () => {
        menu.con('Enter your current PIN. If you have forgotten, enter 1' + 
        '\n1. Forgotten PIN');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'changePin.pin',
        '1': 'forgetPin'
    }
});
 
menu.state('forgetPin', {
    run: () => {
        menu.end('Dear customer, please contact PPT for assistance with your PIN');
    }
});

menu.state('changePin.pin', {
    run: () => {
        menu.con('Enter a new 4 digit PIN');
    },
    next: {
        '*\\d+': 'changePin.newpin'
    }
});

menu.state('changePin.newpin', {
    run: () => {
        menu.con('Confirm new 4 digit PIN');
    },
    next: {
        '*\\d+': 'changePin.confirmpin'
    }
});
 
menu.state('changePin.confirmpin', {
    run: () => {
        var amount = Number(menu.val);
        withdrawalPin(menu.args.phoneNumber, amount).then((res)=>{
            menu.end('You have successfully created your PIN. You will receive and SMS with your PIN number shortly.');
        });
    }
});

/////////////////----------------END CHANGE PIN ROUTE-------------------///////////////////////



// Pension USSD
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    menu.run(args, ussdResult => {
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

function fetchBalance(val) {
    return "2.00"
}

function buyAirtime(phone, val) {
    return true
}