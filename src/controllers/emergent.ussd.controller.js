const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'emergent' });
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
        menu.con(' Welcome to Emergent' +
        '\n1. Pay' +
        '\n2. Check Balance' +
        '\n3. Withdrawal/Claims' +
        '\n4. ICare' +
        '\n5. Contact');
    },
    // next object links to next state based on user input
    next: {
        '1': 'Pay',
        '2': 'checkBalance',
        '3': 'Withdrawal',
        '4': 'ICare',
        '5': 'Contact'
    }
});

menu.state('Pay', {
    run: () => {
        menu.con('Enter amount to Pay');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'Pay.amount'
    }
});

// nesting states
menu.state('Pay.amount', {
    run: () => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Make sure that you have enough balance to proceed with the transaction of GHS ' + amount +
            '\n1. One Time Payment' +
            '\n2. Auto Debit' +
            '\n3. Cancel');

    },
    next: {
        '1': 'Pay.confirm',
        '2': 'Pay.auto',
        '3': 'Pay.cancel'
    }
});

menu.state('Pay.confirm', {
    run: async() => {
        // access user input value save in session
        var amount = await menu.session.get('amount');
        menu.end('Your transaction was successful. You will receive a prompt of GHS ' + amount + ' shortly.');
    }
});

// nesting states
menu.state('Pay.auto', {
    run: () => {
        // save user input in session
        menu.con('Select Frequency:' +
            '\n1. Daily' +
            '\n2. Weekly' +
            '\n3. Monthly');

    },
    next: {
        '1': 'Pay.confirm',
        '2': 'Pay.confirm',
        '3': 'Pay.confirm'
    }
});

menu.state('Pay.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using Emergent.');
    }
});


menu.state('checkBalance', {
    run: () => {
        // fetch balance
        // fetchBalance(menu.args.phoneNumber)
        menu.con('Balance Information' +
            '\nPension: GHS 10.00' +
            '\nSaving GHS 10.00' +
            '\n1. Ok' +
            '\n#. Main Menu');
    },
    next: {
        '1': 'checkBalance.confirm',
        '#': 'Start'
    }
});

menu.state('checkBalance.confirm', {
    run: () => {
        // Ok checkBalance 
        menu.end('Thank you for using People Pension Trust.');
    }
});


menu.state('Withdrawal', {
    run: () => {
        menu.con('Enter amount to Withdraw');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'Withdrawal.amount'
    }
});

// nesting states
menu.state('Withdrawal.amount', {
    run: () => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        menu.session.set('amount', amount);
        // buyAirtime(menu.args.phoneNumber, amount).then((res) => {
        //     menu.end('Airtime bought successfully.');
        // });
        menu.con('Withdrawal request ' +
            '\n Amount GHS ' + amount +
            '\n1. Confirm' +
            '\n2. Cancel');

    },
    next: {
        '1': 'Withdrawal.confirm',
        '2': 'Withdrawal.cancel'
    }
});

menu.state('Withdrawal.confirm', {
    run: () => {
        // submit with request
        var amount = menu.session.get('amount');
        menu.end('Withdraw request of Amount GHC ' + amount + ' has been sent for approval.');
    }
});

menu.state('Withdrawal.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using People Pension Trust.');
    }
});

menu.state('PayOnBehalf', {
    run: () => {
        menu.con('Enter Member Scheme Number');
    },
    next: {
        // using input to match user input to next state
        'input': 'PayOnBehalf.member'
    }
});

menu.state('PayOnBehalf.member', {
    run: () => {
        menu.con('Enter amount to Pay');
    },
    next: {
        // using regex to match user input to next state
        '*\\d+': 'PayOnBehalf.amount'
    }
});

// nesting states
menu.state('PayOnBehalf.amount', {
    run: () => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        menu.session.set('amount', amount);
        menu.con('Make sure that you have enough balance to proceed with the transaction of GHS ' + amount +
            '\n1. One Time Payment' +
            '\n2. Auto Debit' +
            '\n3. Cancel');

    },
    next: {
        '1': 'PayOnBehalf.confirm',
        '2': 'PayOnBehalf.auto',
        '3': 'PayOnBehalf.cancel'
    }
});

// nesting states
menu.state('PayOnBehalf.auto', {
    run: () => {
        // save user input in session
        menu.con('Select Frequency:' +
            '\n1. Daily' +
            '\n2. Weekly' +
            '\n3. Monthly');

    },
    next: {
        '1': 'PayOnBehalf.confirm',
        '2': 'PayOnBehalf.confirm',
        '3': 'PayOnBehalf.confirm'
    }
});

menu.state('PayOnBehalf.confirm', {
    run: () => {
        // access user input value save in session
        var amount = menu.session.get('amount');;
        menu.end('Payment request of amount GHS' + amount + ' sent to your phone.');
    }
});

menu.state('PayOnBehalf.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using People Pension Trust.');
    }
});

menu.state('Contact', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('1. Stop auto-debit' +
            '\n2. Name' +
            '\n3. Email' +
            '\n4. Mobile' +
            '\n5. Website');
    },
    // next object links to next state based on user input
    next: {
        '1': 'AutoDebit',
        '2': 'Contact.name',
        '3': 'Contact.email',
        '4': 'Contact.mobile',
        '5': 'Contact.website'
    }
});

menu.state('AutoDebit', {
    run: () => {
        // Cancel Savings request
        menu.end('Auto Debit disabled successfully.');
    }
});

menu.state('Contact.name', {
    run: () => {
        // Cancel Savings request
        menu.end('People Pension Trust.');
    }
});

menu.state('Contact.email', {
    run: () => {
        // Cancel Savings request
        menu.end('info@peoplespensiontrust.com.');
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
        menu.end('http://www.peoplespensiontrust.com');
    }
});


// USSD Endpoint
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    menu.run(args, ussdResult => {
        res.send(ussdResult);
    });
};


function fetchBalance(val) {
    return "2.00"
}

function buyAirtime(phone, val) {
    return true
}