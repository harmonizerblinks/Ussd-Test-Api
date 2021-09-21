var unirest = require('unirest');
const UssdMenu = require('ussd-builder');
let menu = new UssdMenu({provider: 'africasTalking'});

// var apiurl = 'https://localhost:5001/Integration/';
// var apiurl = 'http://api-aslan.paynowafrica.com/api/services/app/'
// var apiurl = 'https://api.alias-solutions.net:8449/Integration/';
var tenant = 2;
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
        // await fetchAccount(menu.args.phoneNumber, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            // if(data.code) { 
                menu.con('Hello '+data.name+',' +'\nYour Current Fees Amount for Student ID Number '+data.number+' is GHS ' + data.amount + 
                    '\n\n1. Make Payment'); 
        //     } else {
        //         menu.con('Enter Mobile Number that received Bill or Bill Code.');
        //     }
        // });
        
    },
    // next object links to next state based on user input
    next: {
        '1': 'Payment',
        '*[0-9]+': 'Number.account'
    }
});

menu.state('Menu', {
    run: async() => {
        // var mobile = menu.val;
        var data = await menu.session.get('account');
        console.log(data);
        // await fetchAccount(mobile, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            if(data.code) { 
                menu.con('Hello '+data.name+',' +'\nYour Current Fees Amount for Student ID Number '+data.number+' is GHS ' + data.amount + 
                    '\n\n1. Make Payment'); 
            } else {
                // `menu.go('Number');
                menu.con('Enter Mobile Number that received Bill or Bill Code.');
            }
        // });
        
    },
    // next object links to next state based on user input
    next: {
        '1': 'Payment',
        '*[0-9]+': 'Number.account'
    }
});

// nesting states
menu.state('Number.account', {
    run: async() => {
        // use menu.val to access user input value
        var account = menu.val;
        // save user input in session
        // await fetchAccount(account, (data)=> { 
            // console.log(1,data); 
            // use menu.con() to send response without terminating session 
            // if(data.code) { 
                menu.con('Hello '+data.name+',' +'\nYour Current Debt Amount for Student ID Number '+data.number+' is GHS ' + data.amount + 
                    '\n\n1. Make Payment'); 
            // } else {
                // `menu.go('Number');
                // menu.con('Enter Mobile Number that received Bill or Bill Code.');
            // }
        // });

    },
    // next object links to next state based on user input
    next: {
        '1': 'Payment',
        '*[0-9]+': 'Number.account'
    }
});

menu.state('Payment', {
    run: async() => {
        var data = await menu.session.get('account');
        menu.con('Debt Amount: GHS 285.00 \nEnter amount to you want to Pay');
    },
    next: {
        '#': 'Menu',
        // using regex to match user input to next state
        '*\\d+': 'Payment.amount'
    }
});

// nesting states
menu.state('Payment.amount', {
    run: async() => {
        // use menu.val to access user input value
        var amount = Number(menu.val);
        // menu.session.set('amount', amount);
        // var data = await menu.session.get('account');
        menu.con('You want to perform Bill payment of amount GHS '+ amount +' to Student ID Number BBG023943942' +
            '\n1. Confirm' +
            '\n2. Cancel');
        

    },
    next: {
        '1': 'Payment.confirm',
        '2': 'Payment.cancel',
        '#': 'Menu',
        '*': 'Payment'
    }
});

menu.state('Payment.confirm', {
    run: async() => {
        // access user input value save in session
        // var amount = await menu.session.get('amount');
        // var account = await menu.session.get('account');
        // var network = await menu.session.get('network');
        // var mobile = menu.args.phoneNumber;
        // var data = {code: account.code,name:account.name,email:'info@paynow.com',source:'USSD',network:network,mobile: mobile,amount: amount, reference: 'Bill Payment'};
        // await postPayment(data, async(result)=> { 
        //     console.log(result) 
        //     // menu.end(JSON.stringify(result)); 
        // });
        menu.end('Kindly Confirm Payment request of amount GHC GHS 285.00 sent to your phone.');
    }
});

menu.state('Payment.cancel', {
    run: () => {
        // Cancel Payment request
        menu.end('Thank you for using paynow services.');
    }
});


// POST a Insurance
module.exports.ussdApp = (req, res) => {
    console.log(req.body);
    // menu.run(req.body, ussdResult => {
    //         res.send(ussdResult);
    //         // fetchAccount(req.body.phoneNumber);
    // })
}
    


async function fetchAccount(val, callback) {
    // try {
        if (val && val.startsWith('+233')) {
            // Remove Bearer from string
            val = val.replace('+233','');
        }
        var api_endpoint = apiurl + 'GetAccountBalanceByMobile/' + val;
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
            if(response.invoiceid > 0)
            {
                menu.session.set('account', response);
                // menu.session.set('amount', response.amount);
            }
            
            return await callback(response);
        });
    // }
    // catch(err) {
    //     console.log(err);
    //     return err;
    // }
}

async function postPayment(val, callback) {
    var api_endpoint = apiurl + 'BillPayment';
    var req = unirest('POST', api_endpoint)
    .headers({
        'Content-Type': 'application/json'
    })
    .send(JSON.stringify(val))
    .end( async(res)=> { 
        // if (res.error) throw new Error(res.error); 
        var response = JSON.parse(resp.raw_body);
        return await callback(response);
    });
    return true
}
