const UssdMenu = require('ussd-menu-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu();
let sessions = {};
const appKey = '180547238'; const appId = '75318691';
const apiUrl = "https://api.paynowafrica.com";


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
		await fetchCustomer(menu.args.phoneNumber, (data) => {
			if (data.code) {
				menu.con(`Welcome to EPSW,
				1. Pay
				2. Check Policy
				3. Claims
				`)	
			} else {
				menu.end('You are not registered on EPSW. For registration, visit https://www.paynowafrica.com')
			}
		})
	},
	next: {
		'1': 'pay',
		'2': 'checkpolicy',
		'3': 'claims'
	}
})

menu.state('mainmenu', {
	run: async() => {
		await fetchCustomer(menu.args.phoneNumber, (data) => {
			if (data.code) {
				menu.con(`Welcome to EPSW,
				1. Pay
				2. Check Policy
				3. Claims
				`)	
			} else {
				menu.end('You are not registered on EPSW. For registration, visit https://www.paynowafrica.com')
			}
		})
	},
	next: {
		'1': 'pay',
		'2': 'checkpolicy',
		'3': 'claims'
	}
})



///////////////--------------INSURANCE STARTS--------------////////////////

menu.state('pay',{
	run: async() => {
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.type + ' A/C';
            count += 1;
        });
		menu.con(`Please Select Policy Number:
		${schemes}`)
	},
	next: {
		'0': 'mainmenu',
		'*\\d+': 'policy'
	}
})


menu.state('policy', {
	run: async() => {
		var amount = Number(menu.val);
		menu.session.set('amount', amount);
		var fullname = await menu.session.get('name');

		var index = await menu.session.get('userreq');

		var accountinfo = await menu.session.get('accountinfo');
		var account = accountinfo[index - 1];
		menu.session.set('accountnumber', account.accountNumber)
		menu.con(`Dear ${fullname}, you are making a payment of GHS  ${amount}  for policy number ${account.accountNumber}` +
			'\n1. Confirm' +
			'\n2. Cancel'
		)
	},
	next: {
		'1': 'confirm',
		'2': 'deposit',
	}
})

menu.state('confirm', {
	run: async() => {
		await payment(menu.args.phoneNumber, (data) => {
			// console.log(data.body)
			// if (data.body.statusMessage == 'Success') {
				menu.end('Your transaction was successful. \n\nThank you.');
			// }
			// else {
			// 	menu.end('Server Error. Please contact the admin')
			// }
		})
	}
})

///////////////--------------CHECK STATUS STARTS--------------////////////////

menu.state('checkpolicy', {
	run: async() => {
        var schemes = ''; var count = 1;
        var accounts = await menu.session.get('accounts');
        accounts.forEach(val => {
            schemes += '\n' + count + '. ' + val.type + ' A/C';
            count += 1;
        });
		menu.con(`Please Select Policy Number:
		${schemes}`)
	},
	next: {
		'*\\d+': 'checkpolicy.account',
	}
})

menu.state('checkpolicy.account', {
	run: () => {
		menu.con('Your policy number 000000241 will expire on 12/10/21' + '\n\nPress zero (0) to return to the Main Menu')
	},
	next: {
		'0': 'mainmenu'
	}

})

///////////////--------------CLAIMS STARTS--------------////////////////

menu.state('claims', {
	run: () => {
		menu.end('Your request for claim was successful. You will be contacted shortly.')
	}
})

//////////-------------START SESSION FUNCTION--------------//////////////
module.exports.startSession = (req, res) => {
	menu.run(req.body, ussdResult => {
		res.send(ussdResult);
		menu.session.get('network', req.body.networkCode)
	});
}

async function fetchCustomer(val, callback) {
    // try {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    console.log(api_endpoint);
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await callback(resp);
            }
            // console.log(resp.raw_body);
            var response = JSON.parse(resp.raw_body);
            if (response.active) {
                menu.session.set('name', response.name);
                menu.session.set('mobile', val);
                menu.session.set('accounts', response.accounts);
                menu.session.set('cust', response);
                menu.session.set('type', response.type);
                menu.session.set('pin', response.pin);
                // menu.session.set('limit', response.result.limit);
            }

            await callback(response);
        });
    // }
    // catch(err) {
    //     console.log(err);
    //     return err;
    // }
}


async function payment (data, callback) {

	var request = unirest('POST', `${apiUrl}/PayNow/Merchant`)
		.headers({
			'Content-Type': ['application/json', 'application/json']
		})
		.send(JSON.stringify(data))
		.then(async (response) => {
				// menu.session.set('accountinfo', response);
				console.log(response.body)
			await callback(response);
		})
	
	return true;
}
