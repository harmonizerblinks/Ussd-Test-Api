const UssdMenu = require('ussd-menu-builder');
let menu = new UssdMenu({ provider: 'hubtel' });
var unirest = require('unirest');
var apiurl = "https://api.paynowafrica.com/PayNow/";
var studentapiUrl = "http://api.uschoolonline.com/api/Students"
// var studentPaymentAPI = "http://api.uschoolonline.com/api/Students";
let sessions = {};
let church = ["","Tithe","Offering","Harvest","Donation","Welfare","Others"];
let group = ["","Due","Levies","Welfare","Assessment","Donation","Others"];

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
    menu.end("Error response "+ err);
});

// Define menu states
menu.startState({
    run: () => {
        // use menu.con() to send response without terminating session
        menu.con('Welcome to PayNow Services' +
            '\n1. Payments');
        // menu.con('Welcome to PayNow Services' +
        //     '\n1. Payments' +
        //     '\n2. Airtime' +
        //     '\n3. Financial' +
        //     '\n4. Utility' +
        //     '\n5. Voting');
    },
    // next object links to next state based on user input
    next: {
        '1': 'Payments',
        '2': 'Airtime',
        '3': 'Financial',
        '4': 'Utility',
        '5': 'Voting',
        '6': 'Contact'
    }
});

// Define Start
menu.state('Start', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Welcome to PayNow Services' +
            '\n1) Payments');
    },
    // next object links to next state based on user input
    next: {
        '1': 'Payments',
        '2': 'Airtime',
        '3': 'Financial',
        '4': 'Utility',
        '5': 'Voting'
    }
});

menu.state('Payments', {
    run: () => {
        // use menu.con() to send response without terminating session     
        menu.con(' Payments' +
            '\n1. Pay Church' +
            '\n2. Pay Store' +
            '\n3. Pay Item' +
            '\n4. Pay Invoice' +
            '\n5. Pay Group / Club' +
            '\n6. uSchool' +
            '\n \n#. Main Menu');
    },
    // next object links to next state based on user input
    next: {
        '1': 'Church',
        '2': 'Store',
        '3': 'Item',
        '4': 'Invoice',
        '5': 'Group',
        '6': 'Fees',
        '#': 'Start'
    }
});


menu.state('Church', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Enter Church Code' + '\n' +
            '\n \n#. Main Menu');
    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*\\d+': 'Church.type'
    }
});

// nesting states
menu.state('Church.type', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchMerchant({code: code, type: 'General'}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                // menu.session.set('service', 'Pay Church');
                menu.con('Welcome to '+data.name +
                    '\n1.Tithe' +
                    '\n2.Offering' +
                    '\n3.Harvest' +
                    '\n4.Donation' +
                    '\n5.Welfare' +
                    '\n6.Others');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Church Code' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*[0-9]+': 'Church.amount'
    }
});

// nesting states
menu.state('Church.amount', {
    run: async() => {
        // use menu.val to access user input value
        var val = Number(menu.val);
        var type = church[val];
        menu.session.set('type', type);
        // var name = await menu.session.get('name');
        menu.con('Enter amount for ' + type +
            '\n' +
            '\n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '*[0-9]+': 'Church.reference'
    }
});

// nesting states
menu.state('Church.reference', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Enter Ref / Name' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Church.amount',
        '*[a-zA-Z]+': 'Church.confirm'
    }
});

// nesting states
menu.state('Church.confirm', {
    run: async() => {
        // use menu.val to access user input value
        var reference = menu.val;
        // save user input in session
        menu.session.set('reference', reference);
        var type = await menu.session.get('type');
        var name = await menu.session.get('name');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' +type + ' of amount GHC ' + amount + ' to ' + name +
            '\n Reference: '+ reference +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n#. Main Menu');
    },
    next: {
        '1': 'Church.send',
        '2': 'Church.reference'
    }
});

menu.state('Church.send', {
    run: async() => {
        // access user input value save in session
        var code = await menu.session.get('code');
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        // var service = await menu.session.get('service');
        var reference = await menu.session.get('reference');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {code: code, type: type,service: "Pay Church", network:network,mobile: mobile,amount: amount, reference: reference};
        payMerchant(data);
        // await payMerchant(data, async(result)=> { 
        //     console.log(result);
        //     // menu.end(JSON.stringify(result)); 
        // });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Church.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using paynow services.');
    }
});


menu.state('Store', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Enter Store Code' + '\n' +
            '\n \n#. Main Menu');
    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*\\d+': 'Store.amount'
    }
});

// nesting states
menu.state('Store.amount', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchMerchant({code: code, type: 'Store'}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                menu.con('Welcome to '+data.name +
                    '\nEnter amount to Pay ' +
                    '\n' +
                    '\n#. Main Menu, 0. Go back');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Store Code' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '0': 'Store',
        '*[0-9]+': 'Store.reference'
    }
});

// nesting states
menu.state('Store.reference', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Enter Reference' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Store.amount',
        '*[a-zA-Z]+': 'Store.confirm'
    }
});

// nesting states
menu.state('Store.confirm', {
    run: async() => {
        // use menu.val to access user input value
        var reference = menu.val;
        // save user input in session
        menu.session.set('reference', reference);
        var name = await menu.session.get('name');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' +name + ' an amount of GHC ' + amount +
            '\n Reference: '+ reference +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n \n#. Main Menu');

    },
    next: {
        '1': 'Store.send',
        '2': 'Store.reference'
    }
});

menu.state('Store.send', {
    run: async() => {
        // access user input value save in session
        var code = await menu.session.get('code');
        // var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        // var service = await menu.session.get('service'); 
        var reference = await menu.session.get('reference');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {code: code, type: "Payment",service: "Pay Merchant", network:network,mobile: mobile,amount: amount, reference: reference};
        payMerchant(data);
        // await payMerchant(data, async(result)=> { 
        //     console.log(result);
        //     // menu.end(JSON.stringify(result)); 
        // });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Store.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using paynow services.');
    }
});


menu.state('Item', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Enter Item Code' + '\n' +
            '\n \n#. Main Menu');
    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*\\d+': 'Item.item'
    }
});

// nesting states
menu.state('Item.item', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchItem({code: code}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                // menu.session.set('service', 'Pay Church');
                menu.con('Name: '+data.name +
                    '\nAmount: GHC' + data.amount +
                    '\nCategory: ' + data.category +
                    '\nDescription' + data.description +
                    '\n\nEnter Quantity' +
                    '\n\n0. Go Back');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Item Code' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '0': 'Item',
        '*[0-9]+': 'Item.quantity'
    }
});

// nesting states
menu.state('Item.quantity', {
    run: async() => {
        // use menu.val to access user input value
        var quantity = Number(menu.val);
        menu.session.set('quantity', quantity);
        // var name = await menu.session.get('name');
        menu.con('Enter amount for ' + type +
            '\n' +
            '\n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '*[0-9]+': 'Item.reference'
    }
});

// nesting states
menu.state('Item.reference', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Enter Ref / Name' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Item.amount',
        '*[a-zA-Z]+': 'Item.confirm'
    }
});

// nesting states
menu.state('Item.confirm', {
    run: async() => {
        // use menu.val to access user input value
        var reference = menu.val;
        // save user input in session
        menu.session.set('reference', reference);
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' +type + ' of amount GHC ' + amount +
            '\n Reference: '+ reference +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n \n#. Main Menu');

    },
    next: {
        '1': 'Item.send',
        '2': 'Item.reference'
    }
});

menu.state('Item.send', {
    run: async() => {
        // access user input value save in session
        var code = await menu.session.get('code');
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        // var service = await menu.session.get('service');
        var reference = await menu.session.get('reference');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {code: code, type: type,service: "Pay Church", network:network,mobile: mobile,amount: amount, reference: reference};
        await payMerchant(data, async(result)=> { 
            console.log(result);
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Item.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using paynow services.');
    }
});


menu.state('Invoice', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Enter Invoice Code' + '\n' +
            '\n \n#. Main Menu');
    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*\\d+': 'Invoice.type'
    }
});

// nesting states
menu.state('Invoice.type', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchInvoice({code: code, type: 'General'}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                // menu.session.set('service', 'Pay Church');
                menu.con('Welcome to '+data.name +
                    '\n1.Tithe' +
                    '\n2.Offering' +
                    '\n3.Harvest' +
                    '\n4.Donation' +
                    '\n5.Welfare' +
                    '\n6.Others');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Church Code' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*[0-9]+': 'Invoice.amount'
    }
});

// nesting states
menu.state('Invoice.amount', {
    run: async() => {
        // use menu.val to access user input value
        var val = Number(menu.val);
        var type = church[val];
        menu.session.set('type', type);
        // var name = await menu.session.get('name');
        menu.con('Enter amount for ' + type +
            '\n' +
            '\n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '*[0-9]+': 'Invoice.reference'
    }
});

// nesting states
menu.state('Invoice.reference', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Enter Reference' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Invoice.amount',
        '*[a-zA-Z]+': 'Invoice.confirm'
    }
});

// nesting states
menu.state('Invoice.confirm', {
    run: async() => {
        // use menu.val to access user input value
        var reference = menu.val;
        // save user input in session
        menu.session.set('reference', reference);
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' +type + ' of amount GHC ' + amount +
            '\n Reference: '+ reference +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n \n#. Main Menu');

    },
    next: {
        '1': 'Invoice.send',
        '2': 'Invoice.reference'
    }
});

menu.state('Invoice.send', {
    run: async() => {
        // access user input value save in session
        var code = await menu.session.get('code');
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        // var service = await menu.session.get('service');
        var reference = await menu.session.get('reference');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {code: code, type: type,service: "Pay Church", network:network,mobile: mobile,amount: amount, reference: reference};
        await payMerchant(data, async(result)=> { 
            console.log(result);
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Invoice.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using paynow services.');
    }
});


menu.state('Group', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Enter Group Code' + '\n' +
            '\n \n#. Main');
    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*\\d+': 'Group.type'
    }
});

// nesting states
menu.state('Group.type', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchMerchant({code: code, type: 'General'}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                // menu.session.set('service', 'Pay Church');
                menu.con('Welcome to '+data.name +
                    '\n1.Due' +
                    '\n2.Levies' +
                    '\n3.Welfare' +
                    '\n4.Assessment' +
                    '\n5.Donation' +
                    '\n6.Others');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Group Code' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*[0-9]+': 'Group.amount'
    }
});

// nesting states
menu.state('Group.amount', {
    run: async() => {
        // use menu.val to access user input value
        var val = Number(menu.val);
        var type = group[val];
        menu.session.set('type', type);
        // var name = await menu.session.get('name');
        menu.con('Enter amount for ' + type +
            '\n' +
            '\n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '*[0-9]+': 'Group.reference'
    }
});

// nesting states
menu.state('Group.reference', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Enter Ref / Name' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Group.amount',
        '*[a-zA-Z]+': 'Group.confirm'
    }
});

// nesting states
menu.state('Group.confirm', {
    run: async() => {
        // use menu.val to access user input value
        var reference = menu.val;
        // save user input in session
        menu.session.set('reference', reference);
        var type = await menu.session.get('type');
        var name = await menu.session.get('name');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' + type + ' of amount GHC ' + amount + ' to ' + name +
            '\n Reference: '+ reference +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n \n#. Main Menu');

    },
    next: {
        '1': 'Group.send',
        '2': 'Group.reference'
    }
});

menu.state('Group.send', {
    run: async() => {
        // access user input value save in session
        var code = await menu.session.get('code');
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        // var service = await menu.session.get('service');
        var reference = await menu.session.get('reference');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {code: code, type: type,service: "Pay Group", network:network,mobile: mobile,amount: amount, reference: reference};
        await payMerchant(data, async(result)=> { 
            console.log(result);
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Group.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using paynow services.');
    }
});

menu.state('Fees', {
    run: () => {
        menu.con('Welcome to uSchool Payment Services. Enter Student Number');
    },
    next: {
        '*\\d+': 'Fees.studentId'
    }
});

menu.state('Fees.studentId', {
    run: async() => {
        let studentId = menu.val
        menu.session.set('studentId', studentId);
        let code = studentId.substring(0,3);
        // console.log(code);
        menu.session.set('code', code);
        await fetchStudent(studentId, (data) => {
            menu.con('School Name: '+ data.schoolName  +'\nStudent Name: '+ data.studentName +'\nDebt Amount: GHS '+ data.feesBalance +' \nEnter amount you want to pay');
        })
    },
    next: {
        '*\\d+': 'Fees.amount'
    }
});

menu.state('Fees.amount', {
    run: async() => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        let studentName = await menu.session.get('studentname');
        menu.con('You want to perform Fees payment of amount GHS '+ amount +' for ' + studentName +
        '\n1. Confirm' +
        '\n2. Cancel');
    },
    next: {
        '1': 'Fees.confirm',
        '2': 'Fees.cancel'
    }
});

menu.state('Fees.confirm', {
    run: async() => {
        // access user input value save in session
        var code = await menu.session.get('code');
        var studentId = await menu.session.get('studentId');
        var amount = await menu.session.get('amount');
        var network = await menu.session.get('network');
        var mobile = menu.args.phoneNumber;
        var data = {code: code, type: "Fees",service: "Pay Fees", network:network,mobile: mobile,amount: amount, reference: "School Fees payment for " + studentId};
        // console.log(data);
        await postStudentPayment(data, async(result)=> { 
            console.log(result);
            // menu.end(JSON.stringify(result)); 
        });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. Kindly confirm payment');
    }
});



menu.state('Contact', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('1. Name' +
            '\n2. Email' +
            '\n3. Mobile' +
            '\n4. Website');
    },
    // next object links to next state based on user input
    next: {
        '1': 'Contact.name',
        '2': 'Contact.email',
        '3': 'Contact.mobile',
        '4': 'Contact.website'
    }
});

menu.state('Contact.name', {
    run: () => {
        // Cancel Savings request
        menu.end('PayNow Africa Services.');
    }
});

menu.state('Contact.email', {
    run: () => {
        // Cancel Savings request
        menu.end('info@paynowafrica.com.');
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
        menu.end('http://www.paynowafrica.com');
    }
});

menu.state('Fees.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end(' ');
    }
});




// POST Paynow
exports.ussd = async(req, res) => {
    // Create a 
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    menu.run(args, ussdResult => {
        menu.session.set('network', args.Operator || 'MTN');  
        res.send(ussdResult);
    });
};


async function fetchMerchant(val, callback) {
    // try {
    var api_endpoint = apiurl + 'Merchant/' + val.type + '/' + val.code;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        // if (resp.error) { 
        //     console.log(resp.error); 
        //     // var response = JSON.parse(res); 
        //     return res;
        // }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if(response.code)
        {
            menu.session.set('mtype', response.type);
            menu.session.set('code', response.code);
            menu.session.set('name', response.name);
            // menu.session.set('type', response.type);
            menu.session.set('merchantid', response.merchantid);
            // menu.session.set('limit', response.result.limit);
        }
        
        await callback(response);
    });
}

async function payMerchant(val, callback) {
    console.info(val);
    var api_endpoint = apiurl + 'Merchant';
    console.log(api_endpoint);
    var request = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({ "code": val.code, "type": val.type, "amount": val.amount, "mobile": val.mobile, "network": val.network, "service": val.service, "reference": val.reference }))
    .end(async(resp) => {
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
}

async function fetchItem(val, callback) {

    var api_endpoint = apiurl + 'Item/' + val.code;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        // if (resp.error) { 
        //     console.log(resp.error); 
        //     // var response = JSON.parse(res); 
        //     return res;
        // }
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        if(response.code)
        {
            menu.session.set('code', response.code);
            menu.session.set('name', response.name);
            menu.session.set('category', response.category);
            menu.session.set('itemamount', response.amount);
            menu.session.set('merchant', response.merchant);
            menu.session.set('itemquantity', response.quantity);
        }
        
        await callback(response);
    });
}

async function payItem(val, callback) {
    
    var api_endpoint = apiurl + 'Merchant';
    console.log(api_endpoint);
    var request = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({ "code": val.code, "name": val.name, "email": val.email, "amount": val.amount, "mobile": val.mobile, "provider": val.network, "quantity": val.quantity, "source": "Ussd", "reference": val.reference, "userid": "Ussd", "botid": "Ussd", "order_id": "Ussd" }))
    .end(async(resp) => {
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
}

async function fetchInvoice(val, callback) {
    // try {
        var api_endpoint = apiurl + 'Invoice/' + val.code;
        console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            // if (resp.error) { 
            //     console.log(resp.error); 
            //     // var response = JSON.parse(res); 
            //     return res;
            // }
            console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if(response.code)
            {
                menu.session.set('code', response.code);
                menu.session.set('name', response.name);
                menu.session.set('mobile', response.mobile);
                menu.session.set('amount', response.amount);
                menu.session.set('merchantid', response.merchantid);
                // menu.session.set('quantity', response.quantity);
            }
            
            await callback(response);
        });
}

async function fetchUtility(val, callback) {
    // try {
        var api_endpoint = apiurl + 'Utility/' + val.code;
        console.log(api_endpoint);
        var request = unirest('GET', api_endpoint)
        .end(async(resp)=> { 
            // if (resp.error) { 
            //     console.log(resp.error); 
            //     // var response = JSON.parse(res); 
            //     return res;
            // }
            console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if(response.code)
            {
                menu.session.set('code', response.code);
                menu.session.set('name', response.name);
                // menu.session.set('category', response.category);
                menu.session.set('amount', response.amount);
                // menu.session.set('merchant', response.merchant);
                // menu.session.set('quantity', response.quantity);
            }
            
            await callback(response);
        });
}

async function buyAirtime(val, callback) {
    
    var api_endpoint = apiurl + 'Merchant';
    console.log(api_endpoint);
    var request = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({ "code": val.code, "name": val.name, "email": val.email, "amount": val.amount, "mobile": val.mobile, "provider": val.network, "quantity": val.quantity, "source": "Ussd", "reference": val.reference, "userid": "Ussd", "botid": "Ussd", "order_id": "Ussd" }))
    .end(async(resp) => {
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        await callback(response);
    });
}

async function fetchStudent(val, callback) {

    var api_endpoint = studentapiUrl + '?StudentNumber=' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        // if (resp.error) { 
        //     console.log(resp.error); 
        //     // var response = JSON.parse(res); 
        //     return res;
        // }
        // console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        console.log(response)
            menu.session.set('studentinfo', response);
            menu.session.set('studentname', response.studentName);
            // menu.session.set('category', response.category);
            // menu.session.set('itemamount', response.amount);
            // menu.session.set('itemquantity', response.quantity);
        
        await callback(response);
    });
}

// async function postStudentPayment(val, callback) {

//     var api_endpoint = "http://api.uschoolonline.com/api/Students";
//     console.log(api_endpoint);
//     var request = unirest('POST', api_endpoint)
//     .headers({
//         'Content-Type': 'application/json'
//     })
//     .send(JSON.stringify({ "code": val.code, "type": val.type, "amount": val.amount, "mobile": val.mobile, "network": val.network, "service": val.service, "reference": val.reference }))
//     .end(async(resp) => {
//         console.log(resp.raw_body);
//         var response = JSON.parse(resp.raw_body);
//         await callback(response);
//     });
// }

// Post Payment

async function postStudentPayment(val, callback){
    console.info(val);
    var api_endpoint = apiurl + 'Merchant';
    console.log(api_endpoint);
    var request = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify({ "code": val.code, "type": val.type, "amount": val.amount, "mobile": val.mobile, "network": val.network, "service": val.service, "reference": val.reference }))
    .end(async(resp) => {
        console.log(resp.raw_body);
        var response = JSON.parse(resp.raw_body);
        var body = response;
        setTimeout(() => { getCallBack(body, val); }, 60000);
        await callback(response);
    });
};

function getCallBack(code, val) {
    var req = unirest('GET', 'https://api.paynowafrica.com/paynow/confirmation/' + code.transaction_no)
        .end(async(res)=>{
            var body = JSON.parse(res.raw_body);
            if (body.status_code ===  -1 || body.status_code === 0) {
                setTimeout(() => { getCallBack(code, val); }, 60000);
                // var callback = setTimeout(getCallBack(body, body.response.transaction_no), 200000);
            } else if(body.status_code === 1 ) {
                let ref = val.reference.split(" ");
                var data = {
                    "studentNumber": ref[4],
                    "amountpaid": val.amount,
                    "datepaid": new Date(),
                    "phonenumber": val.mobile,
                    "statuscode": body.status_code,
                    "statusmessage": body.status_message,
                    "schoolcode": val.code,
                    "paynow_ref": body.transaction_no,
                    "network_ref": body.interpaytxnref,
                    "network": val.network
                }
                console.log(data)        
                var api_endpoint = studentapiUrl;
                var request = unirest('POST', api_endpoint)
                .headers({
                    'Content-Type': 'application/json'
                })
                .send(JSON.stringify(data))
                .end(async(resp) => {
                    console.log(resp.raw_body);
                    var response = JSON.parse(resp.raw_body);
                    await callback(response);
                });
            }

        });
}



function fetchBalance(val) {
    return "2.00"
}

// function buyAirtime(phone, val) {
//     return true
// }