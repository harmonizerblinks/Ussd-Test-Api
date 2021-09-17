const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let sessions = {};
let genderArray = ["", "Male", "Female"];
var numbers = /^[0-9]+$/;
const AirtelService = require('./services/airtel_service');

let access = { code: "ACU001", key: "1029398" };
let optionArray = ['Daily', 'Weekly', 'Monthly', 'Only Once'];

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
        let WelcomeNewUser = 'Welcome to Daakye Personal SUSU\nSelect Susu Type\n' +
            '\n1. Personal' +
            '\n2. Group';
        await AirtelService.fetchCustomer(menu.args.phoneNumber, access,
            (response) => {
                if (response.pin_changed == true) {
                    menu.con(WelcomeNewUser)
                }
                else {
                    menu.con('Welcome to Daakye Personal SUSU. Please create a PIN before continuing' + '\nEnter 4 digits.')
                }

            },
            (error) => {
                menu.con(WelcomeNewUser);
            })

    },
    // next object links to next state based on user input
    next: {
        '1': 'Personal',
        '2': 'Group',
        '*[0-9]+': 'User.newpin'
    }
});

//////////////////////////////////////////////////////////////////////////////////////

menu.state('Personal', {
    run: async () => {
        await AirtelService.fetchCustomer(menu.args.phoneNumber, access,
            (response) => {
                menu.con('Welcome to Daakye Personal SUSU' +
                    '\n1. Savings' +
                    '\n2. Withdrawal' +
                    '\n3. My Account')
            },
            (error) => {
                menu.con('Register' +
                    '\n0. Register New Account'
                )
            })
    },
    next: {
        '0': 'Personal.Register',
        '1': 'Personal.Savings',
        '2': 'Personal.Withdrawal',
        '3': 'Personal.MyAccount',
    }
})

menu.state('Personal.Register', {
    run: async () => {
        menu.con('Register' +
            '\nTerms & Conditions' +
            '\n1. Read' +
            '\n2. I have read, Proceed to register'
        )
    },
    next: {
        '1': 'Personal.Register.Read',
        '2': 'Personal.Register.AcceptDecline'
    }
})

menu.state('Personal.Register.Read', {
    run: async () => {
        menu.con('Register' +
            '\nTerms & Conditions' +
            '\n*Interest rates' +
            '\n*Withdrawal limits' +
            '\n*Any other' +
            '\n1. Register' +
            '\n2. Go back'
        )
    },
    next: {
        '1': 'Personal.Register.AcceptDecline',
        '2': 'Personal.Register'
    }
})

menu.state('Personal.Register.AcceptDecline', {
    run: async () => {
        menu.con(
            'Dear customer, ' +
            '\nThank you for registering, Press' +
            '\n1. Accept' +
            '\n2. Decline'
        )
    },
    next: {
        '1': 'Personal.Register.Accept',
        '2': 'Personal.Register.Decline'
    }
})

menu.state('Personal.Register.Accept', {
    run: async () => {
        menu.con(
            'You have successfully completed your account registration, ' +
            '\nYour account number is ###' +
            '\n1. Make Payment' +
            '\n2. Exit'
        )
    },
    next: {
        '2': 'Exit'
    },
    defaultNext: '__start__'
})

menu.state('Personal.Register.Decline', {
    run: async () => {
        menu.go('Exit')
    },
})

menu.state('Personal.Savings', {
    run: () => {
        let message = "";
        optionArray.forEach((element, index) => {
            message += `${(index + 1)}. ${element}`;
        });
        menu.con(message)
    },
    next: {
        '*[1-4]+': 'Personal.Savings.ChooseOption',
    }
})

menu.state('Personal.Savings.ChooseOption', {
    run: async () => {
        var option_index = Number(menu.val);
        var option = optionArray[(option_index - 1)];
        menu.con(
            `Enter savings Amount`
        )

    },
    next: {
        '*\\d+': 'Personal.Savings.Amount',
    }
})

menu.state('Personal.Savings.Amount', {
    run: () => {
        menu.con(
            `Dear customer,\n` +
            `Confirm payment of GHS ${menu.val} to\n` +
            `Daakye Susu for account number` +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n3. Cancel'
        )
    },
    next: {
        '1': 'Personal.Savings.Amount.Confirm',
        '2': 'Personal.Savings.ChooseOption',
        '3': 'Exit'
    }
})

menu.state('Personal.Savings.Amount.Confirm', {
    run: () => {
        menu.go('Exit')
    },
})

menu.state('Personal.Withdrawal', {
    run: () => {
        menu.con('Enter withdrawal Amount')
    },
    next: {
        '*\\d+': 'Personal.Withdrawal.Amount',
    }
})

menu.state('Personal.Withdrawal.Amount', {
    run: () => {
        menu.con(
            `Confirm Withdrawal of  GHS ${menu.val} from your Daakye Susu Account, Account Number` +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n3. Cancel'
        )
    },
    next: {
        '1': 'Personal.Withdrawal.Amount.Confirm',
        '2': 'Personal.Withdrawal',
        '3': 'Exit'
    }
})

menu.state('Personal.Withdrawal.Amount.Confirm', {
    run: () => {
        menu.con(
            `Enter your ATM pin`
        )
    },
    next: {
        '*[0-9]+': 'Personal.Withdrawal.Amount.Confirm.Pin',
    }
})

menu.state('Personal.Withdrawal.Amount.Confirm.Pin', {
    run: () => {
        menu.go('Exit')
    },
})
//////////////////////////////////////////////////////////////////////////////////////

menu.state('Exit', {
    run: () => {
        menu.end('Thank you for using Daakye Personal Susu.')
    }
})

//////////////////////////////////////////////////////////////////////////////////////

menu.state('User.newpin', {
    run: () => {
        if (menu.val.length == 4) {
            var newpin = menu.val;
            menu.session.set('newpin', newpin);
            menu.con('Re-enter the 4 digits');
        } else {
            menu.end('Pin must be 4 digits');
        }
    },
    next: {
        '*\\d+': 'User.verifypin'
    },
    defaultNext: '__start__'
})


menu.state('User.verifypin', {
    run: async () => {
        var pin = await menu.session.get('newpin');
        if (menu.val === pin) {
            var newpin = Number(menu.val);
            var mobile = menu.args.phoneNumber;
            var value = { type: 'Customer', mobile: mobile, pin: pin, newpin: newpin, confirmpin: newpin };
            await postChangePin(value, access, (data) => {
                // console.log(1,data); 
                menu.session.set('pin', newpin);
                menu.con(data.message);
            }).catch((err) => { menu.end(err); });;
        } else {
            menu.con('Incorrect Pin. Enter zero(0) to continue')
        }
    },
    next: {
        '0': '__start__'
    },
    defaultNext: '__start__'
});

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
};

