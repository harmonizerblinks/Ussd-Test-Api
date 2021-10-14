const UssdMenu = require('ussd-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu({ provider: 'emergent' });
let sessions = {};
const appKey = '985684734'; const appId = 'CHOP100';
const apiUrl = "https://api.paynowafrica.com";
// const apiUrl = "https://app.alias-solutions.net:5001/";

let package = [null, {name: 'Love Pack', amount: 100},{name: 'Special pack', amount: 200},{name: 'Surprise pack', amount: 300},null]
let birthdays = [null, {name: 'Xtravaganza', amount: 1000 },{name: 'Birthday bash', amount: 800 },{name: 'Party time', amount: 500},{name: 'Fun time', amount: 300},{name: 'Friends', amount: 100},null]
let unipackArray = ['', '']


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


///////////////--------------MENU STARTS--------------////////////////

menu.startState({
    run: async() => {
        menu.con('Welcome to ChopBox Online \n' +
            '1. Quick Buy\n' +
            '2. Birthday\n' +
            '3. Chopbox Cares\n' +
            '4. Chopbox Cash\n' +
            '5. Contact Us'
        )        
    },
    next: {
        '1': 'Buy',
        '2': 'Birthday',
        '3': 'Cares',
        '4': 'Cash',
        '5': 'contact'
    }
})

menu.state('Start',{
    run: async() => {
        menu.con('Welcome to ChopBox Online \n' +
            '1. Quick Buy\n' +
            '2. Birthday\n' +
            '3. Chopbox Cares\n' +
            '4. Chopbox Cash\n' +
            '5. Contact Us'
        )        
    },
    next: {
        '1': 'Buy',
        '2': 'Birthday',
        '3': 'Cares',
        '4': 'Cash',
        '5': 'contact'
    }
})


///////////////--------------BUY STARTS--------------////////////////

menu.state('Buy',{
    run: () => {
        menu.con('Choose Package:'+ 
        '\n1. UNI pack'+
        '\n2. SHS pack')
    },
    next: {
        '1': 'Uni',
        '2': 'Shs'
    },
    defaultNext: '__start__'
})

///////////////--------------BUY > UNI STARTS--------------////////////////

menu.state('Uni',{
    run: () => {
        menu.con('UNI pack \nChoose package' + 
        '\n1. Love pack - GHS 100' + 
        '\n2. Special pack - GHS 200' + 
        '\n3. Surprise pack - GHS 300')
    },
    next: {
        '*\\d+': 'Uni.package'
    }
})

menu.state('Uni.package',{
    run: async() => {
        var pack = package[menu.val];
        if(pack){
            menu.session.set('package', pack);
            menu.session.set('amount', pack.amount);
            menu.con(`Enter Your Chopbox unique Code(your registered code on chopboxonline.com)`);
        } else {
            menu.end(`Invalid Package Selected, Please try again.`);
        }
    },
    next: {
        '*\\d+': 'Buy.schoolid'
    }
})

///////////////--------------BUY > UNI STARTS--------------////////////////

menu.state('Shs',{
    run: () => {
        menu.con('Shs pack \nChoose package' + 
        '\n1. Love pack - GHS 100' + 
        '\n2. Special pack - GHS 200' + 
        '\n3. Surprise pack - GHS 300')
    },
    next: {
        '*\\d+': 'Shs.package'
    }
})

menu.state('Shs.package',{
    run: () => {
        var pack = package[menu.val];
        if(pack){
            menu.session.set('package', pack);
            menu.session.set('amount', pack.amount);
            menu.con(`Enter Your Chopbox unique Code(your registered code on chopboxonline.com)`);
        } else {
            menu.end(`Invalid Package Selected, Please try again.`);
        }
    },
    next: {
        '*\\d+': 'Buy.schoolid'
    }
})


///////////////--------------BIRTHDAY STARTS--------------////////////////

menu.state('Birthday',{
    run: () => {
        menu.con('Birthday \nChoose package' + 
        '\n1. Xtravaganza - GHS 1000' + 
        '\n2. Birthday bash - GHS 800' + 
        '\n3. Party time - GHS 500' +
        '\n4. Fun time - GHS 300' +
        '\n5. Friends - GHS 100')
    },
    next: {
        '*\\d+': 'Birthday.package'
    }
})

menu.state('Birthday.package',{
    run: () => {
        var pack = birthdays[menu.val];
        if(pack){
            menu.session.set('package', pack);
            menu.session.set('amount', pack.amount);
            menu.con(`Enter Your Chopbox unique Code(your registered code on chopboxonline.com)`);
        } else {
            menu.end(`Invalid Package Selected, Please try again.`);
        }
        // menu.con(`Enter Student ID`)
    },
    next: {
        '*\\d+': 'Buy.schoolid'
    }
})

///////////////--------------CHOPBOX CARES STARTS--------------////////////////

menu.state('Cares',{
    run: () => {
        menu.con('Chopbox Cares \nEnter Donation Amount')
    },
    next: {
        '*\\d+': 'Cares.amount'
    }
})

menu.state('Cares.amount',{
    run: () => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        menu.con(`You are about to pay GHS ${amount} to ChopBox Online. Kindly confirm \n1. Confirm \n2. Cancel`)
    },
    next: {
        '1': 'Buy.confirm',
        '2': 'Exit'
    }
})

///////////////--------------CHOPBOX CASH STARTS--------------////////////////

menu.state('Cash',{
    run: () => {
        menu.con('Chopbox Cash \nEnter Topup Amount')
    },
    next: {
        '*\\d+': 'Cash.amount'
    }
})

menu.state('Cash.amount',{
    run: () => {
        let amount = menu.val;
        menu.session.set('amount', amount);
        menu.con(`You are about to pay GHS ${amount} to ChopBox Online. Kindly confirm \n1. Confirm \n2. Cancel`)
    },
    next: {
        '1': 'Buy.confirm',
        '2': 'Exit'
    }
})


///////////////--------------BUY > FINAL STEPS STARTS--------------////////////////
menu.state('Exit',{
    run: () => {
        menu.end('')
    }
})

menu.state('Buy.schoolid',{
    run: async() => {
        let student = menu.val;
        menu.session.set('student', student);
        // let amount = menu.session.get('amount');
        // let package = menu.session.get('package');
        // let studentinfo = menu.session.get('studentinfo');
        menu.con(`Enter Chopbox unique code`);
        // menu.con(`Confirm Payment of GHS ${amount}, ${package.name} for ${student} 
        // \n1. Confirm
        // \n0. Back`)
    },
    next: {
        '0': 'Start',
        '*\\d+': 'Buy.schoolid.confirm',
    }
});

menu.state('Buy.schoolid.confirm',{
    run: async() => {
        // let student = menu.val;
        let student = await menu.session.get('student');
        if(student === menu.val) {
            menu.session.set('student', menu.val);
            let amount = await menu.session.get('amount');
            let package = await menu.session.get('package');
            console.log(package);
            if(package){
                menu.con(`Confirm Payment of GHS ${amount || package.amount}, ${package.name} for ${student} \n1. Confirm \n0. Main Menu`);
            } else{
                menu.con(`Confirm Payment of GHS ${amount} for ${student} \n1. Confirm \n0. Main Menu`);
            }
        } else {
            menu.end('Chopbox unique code do not match');
        }
    },
    next: {
        '0': 'Start',
        '1': 'Buy.confirm',
    }
})

menu.state('Buy.confirm',{
    run: async() => {
        const pack = await menu.session.get('package');
        const student = await menu.session.get('student');
        let data = {
            code: appId,
            type: "Payment",
            amount: await menu.session.get('amount'),
            mobile: menu.args.phoneNumber,
            network: menu.args.operator,
            service: "Pay Merchant",
            reference: 'Payment for '+pack.name +' to userid '+student,
            order_id: generator.generate(7)
        }
    
        await payment(data, (data) => {
            if(data)
                menu.end('You will receive a prompt to complete the payment process.')
            else
                menu.end('Server Error............')
        });
        menu.end('You will receive a prompt to complete the payment process.')
    }
})


//////////-------------CONTACT US STATUS--------------//////////////

menu.state('contact',{
    run: () => {
        menu.end(`Have a question? Contact us
        1. Phone number
        2. Email
        3. Website`)
    }
})


//////////-------------START SESSION FUNCTION--------------//////////////
module.exports.ussdApp = async(req, res) => {
    let args = req.body;
    if (args.Type == 'initiation') {
        args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
    }
    await menu.run(args, async(ussdResult) => {
        // if (args.Operator) { menu.session.set('network', args.Operator);}
        await res.send(ussdResult);
    });
}

async function fetchaccount(val, callback) {
    var url = 'https://chopboxonline.com/wp-json/wp/v2/users?id='+val;
    var request = unirest('GET', `${url}`)
        .headers({
            'Content-Type': ['application/json', 'application/json']
        })
        // .send(JSON.stringify(data))
        .then(async (response) => {
                // menu.session.set('accountinfo', response.body);
                // console.log(response.body)
                return await callback(response);
        })
}

async function payment(data, callback) {
    var request = unirest('POST', `${apiUrl}/PayNow/Merchant`)
        .headers({
            'Content-Type': ['application/json']
        })
        .send(JSON.stringify(data))
        .then(async (response) => {
            return await callback(response);
        });
}
