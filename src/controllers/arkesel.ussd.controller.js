const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({ provider: 'nalo' });
var unirest = require('unirest');
let apiurl = "https://api-demo.creed-cms.com/Website/";
// let apiurl = "http://localhost:54634/Website/";

var access = { key: "", code: "" };

let sessions = {};
let church = ["","Tithe","Offering","Harvest","Donation","Welfare","Others"];

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
        console.log(key,value);
        callback();
    },
    get: (sessionId, key, callback) => {
        // retrieve value by key in current session
        let value = sessions[sessionId][key];
        console.log(key,value);
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
        menu.con('Welcome to Creed Church System' +
            '\n1. Church Code' +
            '\n2. Member Number' +
            '\n9. Contact');
    },
    // next object links to next state based on user input
    next: {
        '1': 'Church',
        '2': 'Member',
        '9': 'Contact'
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
        '*\\d+': 'Church.code'
    }
});


// nesting states
menu.state('Church.code', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchChurch({code: code, type: 'General'}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                menu.session.set('church', data);
                menu.con('Welcome to '+data.church+', '+data.name +
                    '\n1.Proceed' +
                    '\n2.Cancel');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Church Code, Enter 0 to Try Again' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '0': 'Church',
        '1': 'Church.type',
        '2': 'Church.cancel'
    }
});

// nesting states
menu.state('Church.type', {
    run: async() => {
        // use menu.val to access user input value
        // var code = menu.val;
        var church = await menu.session.get('church');
        if(church == null) menu.end("Invalid Input Selected");
        // use menu.con() to send response without terminating session 
        menu.con('Select Payment Type'+
            '\n1.Tithe' +
            '\n2.Offering' +
            '\n3.Harvest' +
            '\n4.Donation' +
            '\n5.Welfare' +
            '\n6.Others');
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
        menu.con('Enter amount to Pay for ' + type +
            '\n' +
            '\n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '*[0-9]+': 'Church.name'
    }
});

// nesting states
menu.state('Church.name', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // save user input in session
        menu.session.set('amount', amount);
        menu.con('Enter Name' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Church.amount',
        '*[a-zA-Z]+': 'Church.reference'
    }
});

// nesting states
menu.state('Church.reference', {
    run: async() => {
        // use menu.val to access user input value
        var name = menu.val;
        // save user input in session
        menu.session.set('name', name);
        menu.con('Enter Ref / Member Number' +
            '\n' +
            '\n#. Main Menu, 0. Go back');

    },
    next: {
        '#': 'Start',
        '0': 'Church.amount',
        '*[a-zA-Z0-9]+': 'Church.confirm'
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
        var church = await menu.session.get('church');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' +type + ' of amount GHC ' + amount + ' to ' + church.name +
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
        var church = await menu.session.get('church');
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        var name = await menu.session.get('name');
        var reference = await menu.session.get('reference');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        // var data = {code: church.code, type: type,service: "Pay Church", network:network,mobile: mobile,amount: amount, reference: reference};
        var data = {
            church:church.code, name:name, email:"ussd@creed-cms.com", source:"USSD", type:type, mobile:mobile,
            channel: network, amount:amount, currency: "GHC", reference: reference,
        }
        // payMerchant(data);

        setTimeout(() => {
            payChurch(data,(result)=> { 
                console.log(result);
                // menu.end(JSON.stringify(result)); 
            });
        }, 3000);
        // payChurch(data,(result)=> { 
        //     console.log(result);
        //     // menu.end(JSON.stringify(result)); 
        // });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Church.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using Creed Church System Ussd.');
    }
});

menu.state('Member', {
    run: () => {
        // use menu.con() to send response without terminating session      
        menu.con('Enter Member Code/ Number' + '\n' +
            '\n \n#. Main Menu');
    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*\\d+': 'Member.code'
    }
});

menu.state('Member.code', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        // save user input in session
        await fetchChurch({code: code, type: 'General'}, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) {
                var church = { code: church_code, church: data.church, branch: data.branch };
                menu.session.set('church', church);
                menu.session.set('member', data);
                menu.con('Hello '+data.name+
                    ', \nWelcome to '+data.church+', '+data.branch +
                    '\n1.Proceed' +
                    '\n2.Cancel');
            } else {
                // `menu.go('Number');
                menu.con('Incorrect Member Code, Enter 0 to Try Again' + 
                '\n#. Main Menu');
            }
        });

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '0': 'Member',
        '1': 'Member.type',
        '2': 'Member.cancel'
    }
});

// nesting states
menu.state('Member.type', {
    run: async() => {
        // use menu.val to access user input value
        var code = menu.val;
        var church = await menu.session.get('church');
        if(church == null) menu.end("Invalid Input Selected");
        // save user input in session
        menu.con('Select Payment Type'+
            '\n1.Tithe' +
            '\n2.Offering' +
            '\n3.Harvest' +
            '\n4.Donation' +
            '\n5.Welfare' +
            '\n6.Others');

    },
    // next object links to next state based on user input
    next: {
        '#': 'Start',
        '*[0-9]+': 'Member.amount',
        '*\\d+': 'Member.type'
    }
});

// nesting states
menu.state('Member.amount', {
    run: async() => {
        // use menu.val to access user input value
        var val = Number(menu.val);
        var type = church[val];
        menu.session.set('type', type);
        // var name = await menu.session.get('name');
        menu.con('Enter amount to Pay for ' + type +
            '\n' +
            '\n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '*[0-9]+': 'Member.reference'
    }
});

// nesting states
menu.state('Member.reference', {
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
        '0': 'Member.amount',
        '*[a-zA-Z0-9]+': 'Member.confirm'
    }
});

// nesting states
menu.state('Member.confirm', {
    run: async() => {
        // use menu.val to access user input value
        var reference = menu.val;
        // save user input in session
        menu.session.set('reference', reference);
        var type = await menu.session.get('type');
        var church = await menu.session.get('church');
        var amount = await menu.session.get('amount');
        menu.con('You want to pay ' +type + ' of amount GHC ' + amount + ' to ' + church.name +
            '\n Reference: '+ reference +
            '\n1. Confirm' +
            '\n2. Go back' +
            '\n#. Main Menu');
        // menu.con('You want to pay ' +type + ' of amount GHC ' + amount +
        //     '\n Reference: '+ reference +
        //     '\n1. Confirm' +
        //     '\n2. Go back' +
        //     '\n \n#. Main Menu');

    },
    next: {
        '#': 'Start',
        '1': 'Member.send',
        '2': 'Member.reference'
    }
});

menu.state('Member.send', {
    run: async() => {
        // access user input value save in session
        var member = await menu.session.get('member');
        var type = await menu.session.get('type');
        var amount = await menu.session.get('amount');
        var church = await menu.session.get('church');
        var reference = await menu.session.get('reference');
        var network = menu.args.operator;
        var mobile = menu.args.phoneNumber;
        // var data = {code: code, type: type,service: "Pay Church", network:network,mobile: mobile,amount: amount, reference: reference};
        var data = {
            church:church.code, name:member.name, email:"ussd@creed-cms.com", source:"USSD", type:type, mobile:mobile,
            channel: network, amount:amount, currency: "GHC", reference: reference,
        }

        setTimeout(() => {
            payChurch(data,(result)=> { 
                console.log(result);
                // menu.end(JSON.stringify(result)); 
            });
        }, 3000);
        // payChurch(data, (result)=> { 
        //     console.log(result);
        //     // menu.end(JSON.stringify(result)); 
        // });
        menu.end('Payment request of amount GHC ' + amount + ' sent to your phone. kindly confirm payment');
    }
});

menu.state('Member.cancel', {
    run: () => {
        // Cancel Savings request
        menu.end('Thank you for using Creed Church System Ussd.');
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
        menu.con('Creed Church Management System.' +
            '\n0. Go back' +
            '\n#. Main Menu');
    },
    next: {
        '#': 'Start',
        '0': 'Contact'
    }
});

menu.state('Contact.email', {
    run: () => {
        // Cancel Savings request
        menu.end('info@creed-cms.com.' +
            '\n0. Go back' +
            '\n#. Main Menu');
    },
    next: {
        '#': 'Start',
        '0': 'Contact'
    }
});

menu.state('Contact.mobile', {
    run: () => {
        // Cancel Savings request
        menu.end('0546467407' +
            '\n0. Go back' +
            '\n#. Main Menu');
    },
    next: {
        '#': 'Start',
        '0': 'Contact'
    }
});

menu.state('Contact.website', {
    run: () => {
        // Cancel Savings request
        menu.end('http://www.creed-cms.com' +
            '\n0. Go back' +
            '\n#. Main Menu');
    },
    next: {
        '#': 'Start',
        '0': 'Contact'
    }
});



// POST Creed
exports.ussdApp = async(req, res) => {
    // Create a 
    let args = req.body;
    console.log(args);
    menu.run(args, ussdResult => {
        console.log(ussdResult);
        res.send(ussdResult);
    });
};


async function fetchChurch(val, callback) {
    // try {
    var api_endpoint = apiurl + 'Church/' + val.code;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error); 
            // var response = JSON.parse(res); 
            return await callback(resp.body);
        }
        console.log(resp.raw_body);
        
        return await callback(resp.body);
    });
}

async function payChurch(val, callback) {
    console.info(val);
    var api_endpoint = apiurl + 'Payment';
    console.log(api_endpoint);
    var request = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    // .send(JSON.stringify({ "code": val.code, "type": val.type, "amount": val.amount, "mobile": val.mobile, "network": val.network, "service": val.service, "reference": val.reference }))
    .end(async(resp) => {
        console.log(resp.raw_body);
        // var response = JSON.parse(resp.raw_body);
        return await callback(resp.body);
    });
}

async function fetchMember(val, callback) {
    // try {
    var api_endpoint = apiurls + 'Member/' + val.code;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
    .end(async(resp)=> { 
        if (resp.error) { 
            console.log(resp.error); 
            // var response = JSON.parse(res); 
            return callback(resp.body);
        }
        console.log(resp.raw_body);
        // var response = JSON.parse(resp.raw_body);
        
        return await callback(resp.body);
    });
}


async function getInfo(val, callback) {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }else if(val && val.startsWith('233')) {
        // Remove Bearer from string
        val = val.replace('233', '0');
    }    

    var api_endpoint = infoUrl + 'getInfo/' + access.code + '/' + access.key + '/' + val;
    var req = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(val))
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                console.log(resp.error);
                // return res;
                return await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if (response.lastname == null) {
                menu.session.set('name', response.firstname)
            }else{
                menu.session.set('name', response.firstname + ' ' + response.lastname)
            }
            return await callback(response);
        });
    return true
}

