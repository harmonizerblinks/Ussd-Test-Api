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
const apiurl = "https://app.alias-solutions.net:5003/Ussd/";

//LIVE
// const apiurl = "https://app.alias-solutions.net:5003/Ussd/";

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
        let WelcomeNewUser = 'Welcome to Daakye Personal SUSU\nSelect Susu Type\n' +
            '\n1. Personal' +
            '\n2. Group';
        await AirtelService.fetchCustomer(apiurl, helpers.formatPhoneNumber(menu.args.phoneNumber), merchant, access,
            (response) => {
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
        await AirtelService.fetchCustomer(apiurl, helpers.formatPhoneNumber(menu.args.phoneNumber), merchant, access,
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
        
        await AirtelService.getInfo( apiurl, access.code, access.key, menu.args.phoneNumber,
            (response) => {
                if(response.firstname && response.lastname){
                    menu.session.set('firstname', response.firstname)
                    menu.session.set('lastname', response.lastname)
                }
                else
                {                
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
                menu.end("Sorry could not register your account");
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
        await AirtelService.CreateCustomer(apiurl, customer, merchant, access,
            (response) => {
                let account = response.accounts[0];
                menu.con(
                    'You have successfully completed your account registration, ' +
                    `\nYour account number is ${account.code}` +
                    '\n1. Make Payment' +
                    '\n0. Exit'
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
    run: () => {
        let message = "";
        optionArray.forEach((element, index) => {
            message += `${(index + 1)}. ${element}\n`;
        });
        menu.con(message)
    },
    next: {
        '*[1-4]+': 'Personal.Savings.ChooseOption',
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
                menu.end("Sorry could not retrieve account details");
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
        let customer = {
            "Account": `${account.code}`,
            "Method": "Momo",
            "Source": "Ussd",
            "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber) ,
            "Amount": amount
        }
        await AirtelService.Deposit(apiurl, customer, merchant, access,
            (response) => {
                menu.end(
                    'You should receive a payment prompt, please approve it to complete the transaction'
                )
            },
            (error) => {
                menu.end("Sorry could not process transaction");
            })
    },
})

menu.state('Personal.Withdrawal', {
    run: () => {
        menu.con('Enter withdrawal amount')
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
        if(pinValid)
        {
            let account = await menu.session.get('account');
            let amount = await menu.session.get('amount');
            let customer = {
                "Account": `${account.code}`,
                "Method": "Momo",
                "Source": "Ussd",
                "Mobile": helpers.formatPhoneNumber(menu.args.phoneNumber) ,
                "Amount": amount
            }
            
            await AirtelService.Withdrawal(apiurl, customer, merchant, access,
                (response) => {
                    menu.end(
                        'Transaction successfully completed '
                    )
                },
                (error) => {
                    if(error.message)
                    {
                        menu.end(error.message);
                    }
                    else
                    {
                        menu.end("Sorry could not process transaction");
                    }
                })
        }
        else{

            menu.end("Invalid pin, please try again later")
        }
    },
})

menu.state('Personal.MyAccount', {
    run: () => {
        menu.con(
            `My Account` +
            '\n1. Check Balance' +
            '\n2. Mini Statement' +
            '\n3. Change Pin'
        )
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
        if(pinValid)
        {
            let account = await menu.session.get('account');            
            if(account.balance || account.balance == 0)
            {
                menu.end(
                    `Your current balance is GHS ${account.balance}\n`
                )    
            }
            else
            {
                menu.end("Sorry could not retrieve account balance");
            }               
        }
        else{
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
        if(pinValid)
        {
            await AirtelService.getAccountTransaction(apiurl, merchant, access,
                (response) => {
                    if(response.length > 0)
                    {
                        let message = `Your last 3 transactions are:\n`

                        response.forEach((element, index) => {
                            message += `${(index + 1)}. ${ helpers.trimDate(element.Date)} - ${ element.Amount}\n`;
                        });

                        menu.end(message ) 
                    }
                    else
                    {
                        menu.end("No recent transactions to display")
                    }
                    
                },
                (error) => {
                    if(error.message)
                    {
                        menu.end(error.message);
                    }
                    else
                    {
                        menu.end("Sorry could not retrieve mini statement");
                    }
                })             
                      
        }
        else{
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
        if(pinValid)
        {
            let hashedOldPin = bcrypt.hashSync(menu.val, 10)
            menu.session.set('old_pin',  hashedOldPin);
            menu.con(
                `Enter new pin\n`
            )              
        }
        else{
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
            await AirtelService.postChangePin(apiurl, customer, merchant, access, (data) => {
                // menu.session.set('pin', newpin);
                menu.end("Pin successfully changed");
            },(err) => { 
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
            await AirtelService.postChangePin(apiurl, customer, merchant, access, (data) => {
                // menu.session.set('pin', newpin);
                menu.end("Pin successfully changed");
            },(err) => { 
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
    run: () => {
        menu.session.set('group_name', menu.val);
        menu.con(
            `Enter Group Description`
        )
    },
    next: {
        '*[a-zA-Z0-9 _]*$': 'Group.CreateOrJoin.Create.Name.Description'
    }
})

menu.state('Group.CreateOrJoin.Create.Name.Description', {
    run: async () => {
        let group_name = await menu.session.get('group_name');
        menu.con(
            `You have created group ${group_name} successfully\n` +
            `You can add new members from the Group Mgt menu\n` +
            `1. Confirm\n` +
            `2. Back\n` +
            `0. Cancel\n`
        )
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
            `Select group to join\n` +
            `1. Group A\n` +
            `2. Group B\n`
        )
    },
    next: {
        '*[1-2]': 'Group.CreateOrJoin.Join.Select',
    }
})

menu.state('Group.CreateOrJoin.Join.Select', {
    run: async () => {
        menu.con(
            `Confirm addition to group` +
            `1. Confirm` +
            `2. Back` +
            `0. Cancel`
        )
    },
    next: {
        '1': 'Group.CreateOrJoin.Join.Select.Confirm',
        '2': 'Group.CreateOrJoin.Join',
        '0': 'Exit',
    }
})

menu.state('Group.CreateOrJoin.Join.Select.Confirm', {
    run: async () => {
        menu.con(
            `Thank you, You have successfully been added to the group` +
            `1. Main Menu` +
            `0. Exit`
        )
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
    run: () => {
        menu.con(
            `Add Group Member\'s Mobile Number\n`
        )
    },
    next: {
        '*\\d+': 'Group.Management.AddMember.Mobile'
    }
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
        menu.con(
            `You have added ${member_phonenumber}\n` +
            `to the group\n` +
            `1. Confirm \n` +
            `2. Back \n` +
            `0. Cancel \n`
        )
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
        menu.con(
            `Enter ATM Pin`
        )
    },
    next: {
        '*\\d+': 'Group.Management.CheckBalance.Pin'
    }

})


menu.state('Group.Management.CheckBalance.Pin', {
    run: () => {
        menu.end(
            `Your current balance is ###`
        )
    }
})

menu.state('Group.Management.MiniStatement', {
    run: () => {
        menu.con(
            `Enter ATM Pin`
        )
    },
    next: {
        '*\\d+': 'Group.Management.MiniStatement.Pin'
    }

})

menu.state('Group.Management.MiniStatement.Pin', {
    run: () => {
        menu.end(
            `Your last 3 transactions are\n` +
            `1. XXX\n` +
            `2. XXX\n` +
            `3. XXX\n`
        )
    }
})

menu.state('Group.Savings', {
    run: () => {
        menu.con(
            `Select group to pay` +
            `1. Group 1\n` +
            `2. Group 2\n`
        )
    },
    next: {
        '*[1-2]': 'Group.Savings.SelectGroup',
    }
})

menu.state('Group.Savings.SelectGroup', {
    run: () => {
        let message = `Choose Option`;
        optionArray.forEach((element, index) => {
            message += `${(index + 1)}. ${element}\n`;
        });
        menu.con(message)
    },
    next: {
        '*[1-2]': 'Group.Savings.SelectGroup.Option',
    }
})

menu.state('Group.Savings.SelectGroup.Option', {
    run: () => {
        var option_index = Number(menu.val);
        var option = optionArray[(option_index - 1)];
        menu.session.set('savings_group_selected', option);

        menu.con(
            `Enter savings amount`
        )
    },
    next: {
        '*\\d+': 'Group.Savings.SelectGroup.Option.Amount',
    }
})

menu.state('Group.Savings.SelectGroup.Option.Amount', {
    run: () => {

        var savings_amount = Number(menu.val);
        menu.con(
            `Dear customer, confirm payment of GHS ${savings_amount}\n` +
            `to Daakye Susu for group\n` +
            `1. Confirm` +
            `0. Cancel`
        )
    },
    next: {
        '1': 'Group.Savings.SelectGroup.Option.Amount.Confirm',
        '0': 'Exit'
    }
})

menu.state('Group.Savings.SelectGroup.Option.Amount.Confirm', {
    run: () => {

        menu.end(
            `You will soon receive a prompt to confirm payment\n`
        )
    }
})

menu.state('Group.Withdrawal', {
    run: () => {
        menu.con(
            `Select group to withdraw` +
            `1. Group 1\n` +
            `2. Group 2\n`
        )
    },
    next: {
        '*[1-2]': 'Group.Withdrawal.SelectGroup',
    }
})

menu.state('Group.Withdrawal.SelectGroup', {
    run: () => {
        menu.con(
            `Enter withdrawal amount`
        )
    },
    next: {
        '*\\d+': 'Group.Withdrawal.SelectGroup.Amount',
    }
})

menu.state('Group.Withdrawal.SelectGroup.Amount', {
    run: () => {
        let withdrawal_amount = Number(menu.val);
        menu.con(
            `Confirm withdrawal of ${withdrawal_amount} from group\n` +
            `1. Confirm` +
            `2. Back` +
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
    run: () => {
        menu.end(
            `You will receive a prompt to approve withdrawal \n`
        )
    }
})

//Group Approval
menu.state('Group.Approval', {
    run: () => {
        menu.con(
            `Select group` +
            `1. Group 1\n` +
            `2. Group 2\n`
        )
    },
    next: {
        '*[1-2]': 'Group.Approval.SelectGroup',
    }
})

menu.state('Group.Approval.SelectGroup', {
    run: () => {
        menu.con(
            `Transactions\n` +
            `1. Member 1... GHS amount ...\n` +
            `2. Member 2... GHS amount ...\n`
        )
    },
    next: {
        '*[1-2]': 'Group.Approval.SelectGroup.Transactions',
    }
})

menu.state('Group.Approval.SelectGroup.Transactions', {
    run: () => {
        menu.con(
            `Confirm withdrawal of GHS amount\n` +
            `from your Daakye Susu account\n` +
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
    run: () => {
        menu.end(
            `Withdrawal successfully approved\n`
        )
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
    run: () => {
        menu.end(
            `Withdrawal transaction successfully declined\n`
        )
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

