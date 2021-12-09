const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
let helpers = require('../../utils/helpers')
let sessions = {};
let genderArray = ["", "Male", "Female"];
var numbers = /^[0-9]+$/;
const AirtelService = require('./services/airtel_service');
const bcrypt = require('bcryptjs');

//TEST
// const apiurl = "https://app.alias-solutions.net:5003/Ussd/";
const apiurl = "http://localhost:5000/AirtelTigo/";
const ussdapiurl = "http://localhost:5000/Ussd/";

//LIVE
// const apiurl = "https://app.alias-solutions.net:5003/AirtelTigo/";
// const ussdapiurl = "https://app.alias-solutions.net:5003/Ussd/";

let access = { code: "AirtelTigo", key: "1234" };
let merchant = "AirtelTigo";
let optionArray = ['Daily', 'Weekly', 'Monthly', 'Only Once'];
let member_roles = ['Member', 'Ass. Leader'];

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
    menu.end('error ' + err);
});

// Define menu states
menu.startState({
    run: async () => {
        let WelcomeNewUser = 'Welcome to Daakye Personal SUSU\nSelect Susu Type' +
            '\n1. Personal' +
            '\n2. Group';
        await AirtelService.fetchCustomer(ussdapiurl, helpers.formatPhoneNumber(menu.args.phoneNumber), merchant, access,
            (response) => {
                // console.log(response);
                if (response.pin) {
                    menu.session.set('pin', response.pin);
                    menu.session.set('account', response.accounts[0]);
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
        await AirtelService.getCustomerAccount(apiurl, merchant, access.key, helpers.formatPhoneNumber(menu.args.phoneNumber),1 ,
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

        // await AirtelService.getInfo( "http://localhost:4041/api/", access.code, access.key, menu.args.phoneNumber,
        await AirtelService.getInfo(ussdapiurl, access.code, access.key, menu.args.phoneNumber,
            (response) => {
                if (response.firstname && response.lastname) {
                    menu.session.set('firstname', response.firstname)
                    menu.session.set('lastname', response.lastname)
                }
                else {
                    menu.session.set('firstname', "N/A")
                    menu.session.set('lastname', "")
                }
                menu.con(
                    'Dear customer, ' +
                    '\nThank you for registering, Press' +
                    '\n1. Accept' +
                    '\n2. Decline'
                )
            },
            (error) => {
                menu.session.set('firstname', "N/A")
                menu.session.set('lastname', "")
            })
    },
    next: {
        '1': 'Personal.Register.Accept',
        '2': 'Personal.Register.Decline'
    }
})

menu.state('Personal.Register.Accept', {
    run: async () => {

        let firstname = await menu.session.get('firstname');
        let lastname = await menu.session.get('lastname');
        let gender = "N/A";
        let customer = {
            "FullName": `${firstname} ${lastname}`,
            "Mobile": menu.args.phoneNumber,
            "Gender": gender
        }
        await AirtelService.CreateCustomerAccount(apiurl, customer, merchant, access,
            (response) => {
                let account = response.accounts[0];
                menu.end(
                    'You have successfully completed your account registration, ' +
                    `\nYour account number is ${account.code}`
                    //  +
                    // '\n1. Make Payment' +
                    // '\n0. Exit'
                )
            },
            (error) => {
                menu.end("Sorry could not register your account");
            })

    },
    next: {
        '0': 'Exit'
    },
    defaultNext: '__start__'
})

menu.state('Personal.Register.Decline', {
    run: async () => {
        menu.go('Exit')
    },
})

menu.state('Personal.Savings', {
    run: async () => {

        //check if user is already registered by retrieving their saved pin in session, otherwise they selected this option that wasn't displayed to them
        let pin = await menu.session.get('pin');
        if (pin) {
            let message = "";
            optionArray.forEach((element, index) => {
                message += `${(index + 1)}. ${element}\n`;
            });
            menu.con(message)
        }
        else {
            menu.go("InvalidInput")
        }
    },
    next: {
        '4': 'Personal.Savings.OnlyOnce',
        '*[1-3]+': 'Personal.Savings.ChooseOption',
    }
})

menu.state('Personal.Savings.ChooseOption', {
    run: async () => {

        //first we get the session variable and check if it exists
        //variable will exist if user has already been here and selects Go Back or Back
        //variable won't exist if user is now selecting option but not choosing back
        let personal_savings_option = await menu.session.get('personal_savings_option');
        let option_selected = null;
        if (!personal_savings_option) {
            var option_index = Number(menu.val);
            option_selected = optionArray[(option_index - 1)];
            menu.session.set('personal_savings_option', option_selected);
        }
        menu.con(
            // `Enter savings Amount ${option_selected ? option_selected : personal_savings_option}`
            `Enter savings Amount`
        )

    },
    next: {
        '*\\d+': 'Personal.Savings.Amount',
    }
})

menu.state('Personal.Savings.Amount', {
    run: async () => {
        var mobile = menu.args.phoneNumber;
        await AirtelService.getCustomerAccount(apiurl, merchant, access.key, helpers.formatPhoneNumber(mobile), 1,
            (response) => {
                let account = response;
                menu.session.set('account', account);
                menu.session.set('amount', menu.val);
                menu.con(
                    `Dear customer,\n` +
                    `Confirm payment of GHS ${menu.val} to\n` +
                    `Daakye Susu for account number ${account.code}` +
                    '\n1. Confirm' +
                    '\n2. Go back' +
                    '\n3. Cancel'
                )
            },
            (error) => {
                menu.end( error.message || "Sorry could not retrieve account details");
            })
    },
    next: {
        '1': 'Personal.Savings.Amount.Confirm',
        '2': 'Personal.Savings.ChooseOption',
        '3': 'Exit'
    }
})

menu.state('Personal.Savings.Amount.Confirm', {
    run: async () => {

        let account = await menu.session.get('account');
        let amount = await menu.session.get('amount');
        let personal_savings_option = await menu.session.get('personal_savings_option');
        let customer = {
            "Account": `${account.code}`,
            "Method": "Momo",
            "Source": "Ussd",
            "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber),
            "Amount": amount,
            "Frequency": personal_savings_option,
            "NetWork": menu.args.operator,
        }
        //should hit AutoDebit endpoint, not Deposit endpoint
        await AirtelService.Deposit(ussdapiurl, customer, merchant, access,
            (response) => {
                menu.end(
                    'You should receive a payment prompt, please approve it to complete the transaction'
                )
            },
            (error) => {
                menu.end("Sorry could not process transaction");
            })
    },
});

menu.state('Personal.Savings.OnlyOnce', {
    run: async () => {
        menu.con(
            `Enter savings Amount`
        )
    },
    next: {
        '*\\d+': 'Personal.Savings.OnlyOnce.Amount',
    }
})


menu.state('Personal.Savings.OnlyOnce.Amount', {
    run: async () => {
        var mobile = menu.args.phoneNumber;
        await AirtelService.getCustomerAccount(apiurl, merchant, access.key, helpers.formatPhoneNumber(mobile), 1,
            (response) => {
                let account = response;
                menu.session.set('account', account);
                menu.session.set('amount', menu.val);
                menu.con(
                    `Dear customer,\n` +
                    `Confirm payment of GHS ${menu.val} to\n` +
                    `Daakye Susu for account number ${account.code}` +
                    '\n1. Confirm' +
                    '\n2. Cancel'
                )
            },
            (error) => {
                menu.end(error.message || "Sorry could not retrieve account details");
            })
    },
    next: {
        '1': 'Personal.Savings.OnlyOnce.Amount.Confirm',
        '2': 'Exit'
    }
})


menu.state('Personal.Savings.OnlyOnce.Amount.Confirm', {
    run: async () => {

        let account = await menu.session.get('account');
        let amount = await menu.session.get('amount');
        let customer = {
            "Account": `${account.code}`,
            "Method": "Momo",
            "NetWork": menu.args.operator,
            "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber),
            "Source": "Ussd",
            "Amount": amount
        }
        await AirtelService.Deposit(ussdapiurl, customer, merchant, access,
            (response) => {
                menu.end(
                    'You should receive a payment prompt, please approve it to complete the transaction'
                )
            },
            (error) => {
                menu.end("Sorry could not process transaction");
            })
    },
});


menu.state('Personal.Withdrawal', {
    run: async () => {
        //check if user is already registered by retrieving their saved pin in session, otherwise they selected this option that wasn't displayed to them
        let pin = await menu.session.get('pin');
        if (pin) {
            menu.con('Enter withdrawal amount')
        }
        else {
            menu.go("InvalidInput")
        }
    },
    next: {
        '*\\d+': 'Personal.Withdrawal.Amount',
    }
})

menu.state('Personal.Withdrawal.Amount', {
    run: async () => {
        menu.session.set('withdrawal_amount', menu.val);

        let account = await menu.session.get('account');
        menu.con(
            `Confirm Withdrawal of GHS ${menu.val} from your Daakye Susu Account, Account Number ${account.code}` +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n3. Cancel'
        )
    },
    next: {
        '1': 'Personal.Withdrawal.Amount.Confirm',
        '2': 'Personal.Withdrawal',
        '3': 'Exit'
    },
    defaultNext: 'InvalidInput'
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
    run: async () => {
        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let account = await menu.session.get('account');
            let amount = await menu.session.get('withdrawal_amount');
            let customer = {
                "Account": `${account.code}`,
                "Method": "Momo",
                "NetWork": menu.args.operator,
                "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber),
                "Source": "Ussd",
                "Amount": amount
            }

            await AirtelService.Withdrawal(ussdapiurl, customer, merchant, access,
                (response) => {
                    menu.end(
                        'Transaction successfully completed '
                    )
                },
                (error) => {
                    if (error.message) {
                        menu.end(error.message);
                    }
                    else {
                        menu.end("Sorry could not process transaction");
                    }
                })
        }
        else {

            menu.end("Invalid pin, please try again later")
        }
    },
})

menu.state('Personal.MyAccount', {
    run: async () => {

        //check if user is already registered by retrieving their saved pin in session, otherwise they selected this option that wasn't displayed to them
        let pin = await menu.session.get('pin');
        if (pin) {
            menu.con(
                `My Account` +
                '\n1. Check Balance' +
                '\n2. Mini Statement' +
                '\n3. Change Pin'
            )
        }
        else {
            menu.go("InvalidInput")
        }
    },
    next: {
        '1': 'Personal.MyAccount.CheckBalance',
        '2': 'Personal.MyAccount.MiniStatement',
        '3': 'Personal.MyAccount.ChangePin'
    }
})

menu.state('Personal.MyAccount.CheckBalance', {
    run: () => {
        menu.con(
            `Enter ATM Pin\n`
        )
    },
    next: {
        '*[0-9]+': 'Personal.MyAccount.CheckBalance.Pin',
    }
})


menu.state('Personal.MyAccount.CheckBalance.Pin', {
    run: async () => {
        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let account = await menu.session.get('account');
            if (account.balance || account.balance == 0) {
                menu.end(
                    `Your current balance is GHS ${account.balance}\n`
                )
            }
            else {
                menu.end("Sorry could not retrieve account balance");
            }
        }
        else {
            menu.end("Invalid pin, please try again later")
        }

    }
})

menu.state('Personal.MyAccount.MiniStatement', {
    run: () => {
        menu.con(
            `Enter ATM Pin\n`
        )
    },
    next: {
        '*[0-9]+': 'Personal.MyAccount.MiniStatement.Pin',
    }
})

menu.state('Personal.MyAccount.MiniStatement.Pin', {
    run: async () => {

        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let account = await menu.session.get('account');

            await AirtelService.getAccountTransaction(ussdapiurl, merchant, access, account.code,
                (response) => {
                    if (response.length > 0) {
                        let message = `Your last 3 transactions are:\n`

                        response.forEach((element, index) => {
                            message += `${(index + 1)}. ${helpers.trimDate(element.date)} - GHS ${element.amount}\n`;
                        });

                        menu.end(message)
                    }
                    else {
                        menu.end("No recent transactions to display")
                    }

                },
                (error) => {
                    if (error.message) {
                        menu.end(error.message);
                    }
                    else {
                        menu.end("Sorry could not retrieve mini statement");
                    }
                })

        }
        else {
            menu.end("Invalid pin, please try again later")
        }
    }
})

menu.state('Personal.MyAccount.ChangePin', {
    run: () => {
        menu.con(
            `Enter current Pin\n`
        )
    },
    next: {
        '*[0-9]+': 'Personal.MyAccount.ChangePin.CurrentPin',
    }
})

menu.state('Personal.MyAccount.ChangePin.CurrentPin', {
    run: async () => {

        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let hashedOldPin = bcrypt.hashSync(menu.val, 10)
            menu.session.set('old_pin', hashedOldPin);
            menu.con(
                `Enter new pin\n`
            )
        }
        else {
            menu.end("Invalid pin, please try again later")
        }

    },
    next: {
        '*[0-9]+': 'Personal.MyAccount.ChangePin.NewPin',
    },
    defaultNext: 'InvalidInput'
})

menu.state('Personal.MyAccount.ChangePin.NewPin', {
    run: () => {
        if (menu.val.length == 4) {
            menu.session.set('new_pin', menu.val);
            menu.con('Re-enter the new pin');
        } else {
            menu.end('Pin must be 4 digits');
        }
    },
    next: {
        '*\\d+': 'Personal.MyAccount.ChangePin.NewPin.Confirm'
    },
    defaultNext: 'InvalidInput'
})

menu.state('Personal.MyAccount.ChangePin.NewPin.Confirm', {
    run: async () => {
        var pin_new = await menu.session.get('new_pin');
        var old_pin = await menu.session.get('old_pin');

        if (menu.val == pin_new) {
            const hashedPin = bcrypt.hashSync(menu.val, 10);
            var mobile = menu.args.phoneNumber;

            var customer = { "Type": "Customer", "Mobile": helpers.formatPhoneNumber(mobile), "Pin": old_pin, "NewPin": hashedPin, "ConfirmPin": hashedPin };
            await AirtelService.postChangePin(ussdapiurl, customer, merchant, access, (data) => {
                // menu.session.set('pin', newpin);
                menu.end("Pin successfully changed");
            }, (err) => {
                menu.end("Sorry pin could not be changed");
            });

        } else {
            menu.end('Sorry, pin confirmation does not match');
        }
    }
})

//////////////////////////////////////////////////////////////////////////////////////



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
            menu.con('Please re-enter your 4 digits pin');
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
            // var newpin = Number(menu.val);
            const newpin = bcrypt.hashSync(menu.val, 10);
            var mobile = menu.args.phoneNumber;

            var customer = { "Type": "Customer", "Mobile": helpers.formatPhoneNumber(mobile), "Pin": newpin, "NewPin": newpin, "ConfirmPin": newpin };
            await AirtelService.postChangePin(ussdapiurl, customer, merchant, access, (data) => {
                // menu.session.set('pin', newpin);
                menu.end("Pin successfully changed");
            }, (err) => {
                menu.end("Sorry pin could not be changed");
            });
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

menu.state('Group', {
    run: () => {
        menu.con('Welcome to Daakye Group SUSU' +
            '\n1. Create/Join Group' +
            '\n2. Savings' +
            '\n3. Withdrawal' +
            '\n4. Approval' +
            '\n5. Group Mgt'
        )
    },
    next: {
        '1': 'Group.CreateOrJoin',
        '2': 'Group.Savings',
        '3': 'Group.Withdrawal',
        '4': 'Group.Approval',
        '5': 'Group.Management',
    }
})

menu.state('Group.CreateOrJoin', {
    run: () => {
        menu.con(
            `1. Create New Group\n` +
            `2. Join Group\n`
        )
    },
    next: {
        '1': 'Group.CreateOrJoin.Create',
        '2': 'Group.CreateOrJoin.Join'
    }
})

menu.state('Group.CreateOrJoin.Create', {
    run: () => {
        menu.con(
            `Enter Group Name\n`
        )
    },
    next: {
        '*[a-zA-Z0-9 _]*$': 'Group.CreateOrJoin.Create.Name'
    }
})

menu.state('Group.CreateOrJoin.Create.Name', {
    run: async () => {
        menu.session.set('group_name', menu.val);
        // await AirtelService.getInfo( "http://localhost:4041/api/", access.code, access.key, menu.args.phoneNumber,
        await AirtelService.getInfo(ussdapiurl, access.code, access.key, menu.args.phoneNumber,
            (response) => {
                if (response.firstname && response.lastname) {
                    menu.session.set('firstname', response.firstname)
                    menu.session.set('lastname', response.lastname)
                }
                else {
                    menu.session.set('firstname', "N")
                    menu.session.set('lastname', "/A")
                }
            },
            (error) => {
                menu.session.set('firstname', "N")
                menu.session.set('lastname', "/A")
            })
        menu.con(
            `Enter Group Description`
        )
    },
    next: {
        '*[a-zA-Z]+': 'Group.CreateOrJoin.Create.Name.Description'
    }
})

menu.state('Group.CreateOrJoin.Create.Name.Description', {
    run: async () => {
        let group_name = await menu.session.get('group_name');
        let firstname = await menu.session.get('firstname');
        let lastname = await menu.session.get('lastname');
        let mobile = menu.args.phoneNumber
        var group = { "Type": "Group", "Name": group_name, "Mobile": helpers.formatPhoneNumber(mobile), "Group_Leader": `${firstname} ${lastname}`, "Balance": 0 };
        await AirtelService.CreateGroup(apiurl, merchant, access.key, group, (response) => {
            menu.end(
                `You have created group ${group_name} successfully\n` +
                `Group code is ${response.code}\n` +
                `You can add new members from the Group Mgt menu\n`
            )
        }, (err) => {
            menu.end(err.message || "Sorry, could not create group");
        });

    },
    next: {
        '1': 'Exit',
        '2': 'Group.CreateOrJoin.Create',
        '0': 'Exit',
    }
})

menu.state('Group.CreateOrJoin.Join', {
    run: () => {
        menu.con(
            `Enter Group Code\n`
        )
        // menu.con(
        //     `Select group to join\n` +
        //     `1. Group A\n` +
        //     `2. Group B\n`
        // )
    },
    next: {
        '*[a-zA-Z0-9 _]*$': 'Group.CreateOrJoin.Join.Select',
    }
})

menu.state('Group.CreateOrJoin.Join.Select', {
    run: async () => {
        let group_code = menu.val;
        await AirtelService.getGroup(apiurl, merchant, access.key, group_code, (data) => {
            menu.session.set('group_code', group_code);
            menu.session.set('group_name', data.name);
            menu.con(
                `Please confirm your request to join group ${data.name}\n` +
                `1. Confirm\n` +
                `2. Back\n` +
                `0. Cancel\n`
            )
        }, (err) => {
            menu.end(
                `Sorry, group code ${group_code} does not exist\n`
            )
        })
    },
    next: {
        '1': 'Group.CreateOrJoin.Join.Select.Confirm',
        '2': 'Group.CreateOrJoin.Join',
        '0': 'Exit',
    }
})

menu.state('Group.CreateOrJoin.Join.Select.Confirm', {
    run: async () => {
        let group_code = await menu.session.get('group_code');
        let group_name = await menu.session.get('group_name');

        await AirtelService.fetchCustomer(ussdapiurl, helpers.formatPhoneNumber(menu.args.phoneNumber), merchant, access,
            async (response) => {
                let customer = { "FullName": response.fullname, "Mobile": response.mobile, "Gender": response.gender };

                await AirtelService.AddCustomerToGroup(apiurl, merchant, access.key, group_code, customer,
                    (response) => {
                        menu.end(
                            `Thank you, You have successfully been added to group ${group_name}`
                        )
                    },
                    (error) => {
                        menu.end(error.message || "Sorry could not add you to the group");
                    })
            },
            (error) => {
                menu.end('Please register as a customer first'
                )
            })

    },
    next: {
        '1': '__start__',
        '0': 'Exit',
    }
})

menu.state('Group.Management', {
    run: () => {
        menu.con(
            `1. Add Members\n` +
            `2. Check Balance\n` +
            `3. Mini Statement\n`
        )
    },
    next: {
        '1': 'Group.Management.AddMember',
        '2': 'Group.Management.CheckBalance',
        '3': 'Group.Management.MiniStatement',
    }
})

menu.state('Group.Management.AddMember', {
    run: async () => {
        await AirtelService.GetGroupLeaderGroups(apiurl, merchant, access.key, helpers.formatPhoneNumber(menu.args.phoneNumber),
            async (response) => {
                if (response && response.length > 0) {
                    menu.session.set('available_groups', response);
                    let the_message = "Please select the group\n";
                    response.forEach((element, index) => {
                        the_message += `${Number(index + 1)}. ${element.name}\n`;
                    });
                    menu.con(the_message);
                }
                else {
                    menu.end('No groups to display');
                }
            },
            (error) => {
                menu.end(error.message || 'Sorry could not retrieve groups'
                )
            })

    },
    next: {
        '*\\d+': 'Group.Management.AddMember.SelectGroup'
    }
})

menu.state('Group.Management.AddMember.SelectGroup', {
    run: async () => {

        let available_groups = await menu.session.get('available_groups');
        let group = available_groups[Number(menu.val - 1)];
        if (!group) {
            return menu.end("You did not select a valid group");
        }

        menu.session.set('selected_group', group);
        menu.con(
            `Enter Group Member\'s Mobile Number\n`
        )
    },
    next: {
        '*\\d+': 'Group.Management.AddMember.Mobile'
    },
    defaultNext: 'InvalidInput'
})

menu.state('Group.Management.AddMember.Mobile', {
    run: async () => {

        let group_member_phone = await menu.session.get('member_phonenumber');
        if (!group_member_phone) {
            let phone_number = helpers.formatPhoneNumber(menu.val);
            menu.session.set('member_phonenumber', phone_number);
        }

        let message = `Select Member Role\n`;
        member_roles.forEach((element, index) => {
            message += `${(index + 1)}. ${element}\n`;
        });

        menu.con(message)
    },
    next: {
        '*[1-2]': 'Group.Management.AddMember.Mobile.Role'
    }
})


menu.state('Group.Management.AddMember.Mobile.Role', {
    run: async () => {
        let member_phonenumber = await menu.session.get('member_phonenumber');

        let memberRole = member_roles[Number(menu.val) - 1];

        if (memberRole == 'Ass. Leader') {
            let customer = {
                "Mobile": helpers.formatPhoneNumber(member_phonenumber),
                "FullName": "Customer"
            }
            let selected_group = await menu.session.get('selected_group');
            AirtelService.AddGroupVice(apiurl, merchant, access.key, menu.args.phoneNumber, selected_group.code, customer, (response) => {
                return menu.con(
                    `You have successfully added ${member_phonenumber} as the group vice\n`
                )
            }, (err) => {
                console.log(err)
                menu.end(
                    `Sorry could not add group vice`
                )
            })


            // menu.con(
            //     `You have added ${member_phonenumber}\n` +
            //     `to the group\n` +
            //     `1. Confirm \n` +
            //     `2. Back \n` +
            //     `0. Cancel \n`
            // )
        }
        else {
            let customer = {
                "Mobile": helpers.formatPhoneNumber(member_phonenumber),
                "FullName": "Customer"
            }
            let selected_group = await menu.session.get('selected_group');
            AirtelService.AddCustomerToGroup(apiurl, merchant, access.key, menu.args.phoneNumber, selected_group.code, customer, (response) => {
                return menu.con(
                    `You have successfully added ${member_phonenumber} as the group vice\n`
                )
            }, (err) => {
                // console.log(err)
                menu.end(
                    `Sorry could not add group vice`
                )
            })

        }

    },
    next: {
        '1': 'Group.Management.AddMember.Mobile.Role.Confirm',
        '2': 'Group.Management.AddMember.Mobile',
        '3': 'Exit',
    }
})

menu.state('Group.Management.AddMember.Mobile.Role.Confirm', {
    run: () => {
        menu.end(
            `Thank you!` +
            `We will notify the group member to join group for completion\n`
        )
    }
})

menu.state('Group.Management.CheckBalance', {
    run: () => {
        let phone_number = helpers.formatPhoneNumber(menu.args.phoneNumber);
        AirtelService.GetCustomerGroups(apiurl, merchant, access.key, phone_number, (response) => {
            if (response && response.length > 0) {
                menu.session.set('accounts', response);
                let message = `Select group\n`;
                response.forEach((element, index) => {
                    message += `${(index + 1)}. ${element.groupname}\n`;
                });
                menu.con(message)
            }
            else {
                menu.end(
                    `Sorry, you don't belong to any group`
                )
            }

        }, (err) => {
            menu.end(
                err.message || `Sorry, could not get customer's groups\n`
            )
        })
    },
    next: {
        '*\\d+': 'Group.Management.CheckBalance.Group'
    }

})

menu.state('Group.Management.CheckBalance.Group', {
    run: async () => {
        let groups = await menu.session.get('accounts');

        let group = groups[(Number(menu.val) - 1)];
        if (group) {
            menu.session.set('selected_account', group);
            menu.con(
                `Enter ATM Pin`
            )
        }
        else {
            menu.go("InvalidInput")
        }
        
    },
    next: {
        '*\\d+': 'Group.Management.CheckBalance.Pin'
    },
    defaultNext: 'InvalidInput'
})


menu.state('Group.Management.CheckBalance.Pin', {
    run: async() => {
        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let account = await menu.session.get('selected_account');
            await AirtelService.getAccount(ussdapiurl, merchant, access,account.code,
                (response) => {
                    menu.end(
                        `Your current balance is ${response.balance}`
                    )
                },
                (error) => {
                    if (error.message) {
                        menu.end(error.message);
                    }
                    else {
                        menu.end("Sorry could not process transaction");
                    }
                })
        }
        else {
            menu.end("Invalid pin, please try again later")
        }
    }
})

menu.state('Group.Management.MiniStatement', {
    run: () => {
        let phone_number = helpers.formatPhoneNumber(menu.args.phoneNumber);
        AirtelService.GetCustomerGroups(apiurl, merchant, access.key, phone_number, (response) => {
            if (response && response.length > 0) {
                menu.session.set('accounts', response);
                let message = `Select group\n`;
                response.forEach((element, index) => {
                    message += `${(index + 1)}. ${element.groupname}\n`;
                });
                menu.con(message)
            }
            else {
                menu.end(
                    `Sorry, you don't belong to any group`
                )
            }

        }, (err) => {
            menu.end(
                err.message || `Sorry, could not get customer's groups\n`
            )
        })
    },
    next: {
        '*\\d+': 'Group.Management.MiniStatement.Group'
    }

})

menu.state('Group.Management.MiniStatement.Group', {
    run: async () => {
        let accounts = await menu.session.get('accounts');

        let account = accounts[(Number(menu.val) - 1)];
        if (account) {
            menu.session.set('selected_account', account);
            menu.con(
                `Enter ATM Pin`
            )
        }
        else {
            menu.go("InvalidInput")
        }
        
    },
    next: {
        '*\\d+': 'Group.Management.MiniStatement.Pin'
    },

})

menu.state('Group.Management.MiniStatement.Pin', {
    run: async () => {
        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let account = await menu.session.get('selected_account');

            await AirtelService.getAccountTransaction(ussdapiurl, merchant, access, account.code,
                (response) => {
                    if (response.length > 0) {
                        let message = `Your last 3 transactions are:\n`
                        response.forEach((element, index) => {
                            message += `${(index + 1)}. ${helpers.trimDate(element.date)} - GHS ${element.amount}\n`;
                        });

                        menu.end(message)
                    }
                    else {
                        menu.end("No recent transactions to display")
                    }

                },
                (error) => {
                    if (error.message) {
                        menu.end(error.message);
                    }
                    else {
                        menu.end("Sorry could not retrieve mini statement");
                    }
                })
        }
        else {
            menu.end("Invalid pin, please try again later")
        }
    }
})

menu.state('Group.Savings', {
    run: async () => {
        let phone_number = helpers.formatPhoneNumber(menu.args.phoneNumber);
        AirtelService.GetCustomerGroups(apiurl, merchant, access.key, phone_number, (response) => {
            if (response && response.length > 0) {
                menu.session.set('groups', response);
                let message = `Select group to pay\n`;
                response.forEach((element, index) => {
                    message += `${(index + 1)}. ${element.groupname}\n`;
                });
                menu.con(message)
            }
            else {
                menu.end(
                    `Sorry, you don't belong to any group`
                )
            }

        }, (err) => {
            menu.end(
                err.message || `Sorry, could not get customer's groups\n`
            )
        })

    },
    next: {
        '*\\d+': 'Group.Savings.SelectGroup',
    }
})

menu.state('Group.Savings.SelectGroup', {
    run: async () => {
        //check if user selected a valid group #
        let groups = await menu.session.get('groups');

        let group = groups[(Number(menu.val) - 1)];
        if (group) {
            menu.session.set('selected_group', group);
            let message = `Choose Option\n`;
            optionArray.forEach((element, index) => {
                message += `${(index + 1)}. ${element}\n`;
            });
            menu.con(message)
        }
        else {
            menu.go("InvalidInput")
        }
    },
    next: {
        '*[1-4]': 'Group.Savings.SelectGroup.Option',
    },
    defaultNext: 'InvalidInput'
})

menu.state('Group.Savings.SelectGroup.Option', {
    run: () => {
        var option_index = Number(menu.val);
        var option = optionArray[(option_index - 1)];
        if (option) {
            menu.session.set('savings_option_selected', option);

            menu.con(
                `Enter savings amount`
            )
        }
        else {
            menu.go("InvalidInput")
        }
    },
    next: {
        '*\\d+': 'Group.Savings.SelectGroup.Option.Amount',
    },
    defaultNext: 'InvalidInput'
})

menu.state('Group.Savings.SelectGroup.Option.Amount', {
    run: async () => {

        var savings_amount = Number(menu.val);
        menu.session.set('amount', savings_amount);
        let selected_group = await menu.session.get('selected_group');
        menu.con(
            `Dear customer, confirm payment of GHS ${savings_amount}\n` +
            `to Daakye Susu for group ${selected_group.groupname}\n` +
            `1. Confirm\n` +
            `0. Cancel`
        )
    },
    next: {
        '1': 'Group.Savings.SelectGroup.Option.Amount.Confirm',
        '0': 'Exit'
    },
    defaultNext: 'InvalidInput'
})

menu.state('Group.Savings.SelectGroup.Option.Amount.Confirm', {
    run: async () => {

        let account_group = await menu.session.get('selected_group');
        let amount = await menu.session.get('amount');
        let savings_option = await menu.session.get('savings_option_selected');
        let customer = {
            "Account": `${account_group.code}`,
            "Method": "Momo",
            "Source": "Ussd",
            "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber),
            "Amount": amount,
            "Frequency": savings_option,
            "NetWork": menu.args.operator,
            "GroupId": account_group.groupid
        }
        //should hit AutoDebit endpoint, not Deposit endpoint
        await AirtelService.Deposit(ussdapiurl, customer, merchant, access,
            (response) => {
                menu.end(
                    `You will soon receive a prompt to confirm payment\n`
                )
            },
            (error) => {
                menu.end("Sorry could not process transaction");
            })


    }
})

menu.state('Group.Withdrawal', {
    run: () => {
        let phone_number = helpers.formatPhoneNumber(menu.args.phoneNumber);
        AirtelService.GetCustomerGroups(apiurl, merchant, access.key, phone_number, (response) => {
            if (response && response.length > 0) {
                menu.session.set('groups', response);
                let message = `Select group to withdraw from\n`;
                response.forEach((element, index) => {
                    message += `${(index + 1)}. ${element.groupname}\n`;
                });
                menu.con(message)
            }
            else {
                menu.end(
                    `Sorry, you don't belong to any group`
                )
            }

        }, (err) => {
            menu.end(
                err.message || `Sorry, could not get customer's groups\n`
            )
        })
    },
    next: {
        '*\\d+': 'Group.Withdrawal.SelectGroup',
    }
})

menu.state('Group.Withdrawal.SelectGroup', {
    run: async () => {
        let groups = await menu.session.get('groups');

        let group = groups[(Number(menu.val) - 1)];
        if (group) {
            menu.session.set('selected_group', group);
            menu.con(
                `Enter withdrawal amount`
            )
        }
        else {
            menu.go("InvalidInput")
        }
    },
    next: {
        '*\\d+': 'Group.Withdrawal.SelectGroup.Amount',
    }
})

menu.state('Group.Withdrawal.SelectGroup.Amount', {
    run: async () => {
        let withdrawal_amount = Number(menu.val);
        menu.session.set('amount', withdrawal_amount);
        let group = await menu.session.get('selected_group')
        menu.con(
            `Confirm withdrawal of GHS ${withdrawal_amount} from group ${group.groupname}\n` +
            `1. Confirm\n` +
            `2. Back\n` +
            `0. Cancel`
        )
    },
    next: {
        '1': 'Group.Withdrawal.SelectGroup.Amount.Confirm',
        '2': 'Group.Withdrawal',
        '0': 'Exit',
    }
})

menu.state('Group.Withdrawal.SelectGroup.Amount.Confirm', {
    run: () => {
        menu.con(
            `Enter your pin number\n`
        )
    },
    next: {
        '*\\d+': 'Group.Withdrawal.SelectGroup.Amount.Confirm.Pin',
    }
})

menu.state('Group.Withdrawal.SelectGroup.Amount.Confirm.Pin', {
    run: async () => {
        let pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            let account = await menu.session.get('selected_group');
            let amount = await menu.session.get('amount');
            let customer = {
                "Account": `${account.code}`,
                "Method": "Momo",
                "NetWork": menu.args.operator,
                "GroupId": account.groupid,
                "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber),
                "Source": "Ussd",
                "Amount": amount
            }
            await AirtelService.Withdrawal(ussdapiurl, customer, merchant, access,
                (response) => {
                    menu.end(
                        `You will receive a prompt to approve withdrawal \n`
                    )
                },
                (error) => {
                    if (error.message) {
                        menu.end(error.message);
                    }
                    else {
                        menu.end("Sorry could not process transaction");
                    }
                })
        }
        else {
            menu.end("Invalid pin, please try again later")
        }

    }
})

//Group Approval
menu.state('Group.Approval', {
    run: async () => {
        await AirtelService.GetGroupLeaderGroups(apiurl, merchant, access.key, helpers.formatPhoneNumber(menu.args.phoneNumber),
            (response) => {
                if (response && response.length > 0) {

                    menu.session.set('available_groups', response);
                    let message = `Select group:\n`

                    response.forEach((element, index) => {
                        message += `${(index + 1)}. ${element.name}\n`;
                    });
                    menu.con(message)
                }
                else {
                    menu.end('No groups to display')
                }

            },
            (error) => {
                menu.con('Something went wrong, could not get groups');
            })

    },
    next: {
        '*[1-9]': 'Group.Approval.SelectGroup',
    }
})

menu.state('Group.Approval.SelectGroup', {
    run: async () => {

        let available_groups = await menu.session.get('available_groups');
        let group = available_groups[Number(menu.val - 1)];
        if (!group) {
            return menu.end("You did not select a valid group");
        }
        menu.session.set('selected_group', group);

        await AirtelService.GetPendingApprovals(apiurl, merchant, access.key, group.code , helpers.formatPhoneNumber(menu.args.phoneNumber),
            (response) => {
                if (response && response.length > 0) {
                    menu.session.set('pending_approvals', response);
                    let message = `Pending Approvals:\n`

                    response.forEach((element, index) => {
                        message += `${(index + 1)}. ${element.mobile} - GHS ${element.amount}\n`;
                    });
                    menu.con(message)
                }
                else {
                    menu.end('No pending approvals to display')
                }

            },
            (error) => {
                menu.con('Something went wrong, could not get approvals');
            })
    },
    next: {
        '*[0-9]': 'Group.Approval.SelectGroup.Transactions',
    }
})

menu.state('Group.Approval.SelectGroup.Transactions', {
    run: async () => {
        
        let pending_approvals = await menu.session.get('pending_approvals');
        let approval = pending_approvals[Number(menu.val - 1)];
        if (!approval) {
            return menu.end("You did not select a valid approval");
        }
        
        menu.session.set('selected_approval', approval);
        menu.con(
            `Confirm withdrawal of GHS ${approval.amount}\n` +
            `from the Daakye Susu group account\n` +
            `1. Approve\n` +
            `2. Decline\n`
        )
    },
    next: {
        '1': 'Group.Approval.SelectGroup.Transactions.Approve',
        '2': 'Group.Approval.SelectGroup.Transactions.Decline',
    }
})

menu.state('Group.Approval.SelectGroup.Transactions.Approve', {
    run: () => {
        menu.con(
            `Enter your momo pin to approve\n`
        )
    },
    next: {
        '*\\d+': 'Group.Approval.SelectGroup.Transactions.Approve.Pin',
    }
})

menu.state('Group.Approval.SelectGroup.Transactions.Approve.Pin', {
    run: async () => {

        var pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            // selected_approval
            let selected_approval = await menu.session.get('selected_approval');
            var approval = {
                "ApprovalId" : selected_approval.code, 
                "Mobile" : helpers.formatPhoneNumber(menu.args.phoneNumber),
            };

            await AirtelService.WithdrawalApprove(apiurl, merchant, access.key, approval, (data) => {
                menu.end(
                    `Withdrawal successfully approved\n`
                )
            }, (err) => {
                menu.end("Sorry withdrawal could not be approved");
            });
        }
        else {
            menu.end("Invalid pin, please try again later")
        }
    }
})

menu.state('Group.Approval.SelectGroup.Transactions.Decline', {
    run: () => {
        menu.con(
            `Enter your momo pin to decline the transaction\n`
        )
    },
    next: {
        '*\\d+': 'Group.Approval.SelectGroup.Transactions.Decline.Pin',
    }
})

menu.state('Group.Approval.SelectGroup.Transactions.Decline.Pin', {
    run: async () => {
        var pin = await menu.session.get('pin');
        let pinValid = bcrypt.compareSync(menu.val, pin);
        if (pinValid) {
            // selected_approval
            let selected_approval = await menu.session.get('selected_approval');
            var rejected = {
                "ApprovalId" : selected_approval.id, 
                "Mobile" : helpers.formatPhoneNumber(menu.args.phoneNumber),
            };

            await AirtelService.WithdrawalReject(apiurl, merchant, access.key, rejected, (data) => {
                menu.end(
                    `Withdrawal transaction successfully declined\n`
                )
            }, (err) => {
                menu.end("Sorry withdrawal could not be declined");
            });
        }
        else {
            menu.end("Invalid pin, please try again later")
        }
        
    },
})


//////////////////////////////////////////////////////////////////////////////////////

menu.state('InvalidInput', {
    run: () => {
        menu.end('Sorry you selected the wrong option');
    },
});

//////////////////////////////////////////////////////////////////////////////////////


// Daakye USSD
exports.ussdApp = async (req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    menu.run(args, ussdResult => {
        if (args.Operator) { menu.session.set('network', args.Operator); }
        res.send(ussdResult);
    });
};

