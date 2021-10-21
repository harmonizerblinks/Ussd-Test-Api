const UssdMenu = require('ussd-menu-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu();
let sessions = {};
const apiurl = "https://api.paynowafrica.com";
let access = { code: "ACU001", key: "1029398" };
tg
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
	run: async () => {
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
	run: async () => {
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

menu.state('pay', {
	run: async () => {
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
	run: async () => {
		var index = Number(menu.val);
		var accounts = await menu.session.get('accounts');
		// console.log(accounts);
		var cust = await menu.session.get('cust');
		var account = accounts[index - 1]
		menu.session.set('account', account);
		menu.con(`Dear ${cust.fullname}, you are making a payment of GHS  ${amount}  for policy number ${account.accountNumber}` +
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
	run: async () => {
		// access user input value save in session
		//var cust = await menu.session.get('cust');
		var amount = await menu.session.get('amount');
		var account = await menu.session.get('account');
		var network = await menu.session.get('network');
		var mobile = menu.args.phoneNumber;
		var data = { merchant: access.code, account: account.code, type: 'Deposit', network: network, mobile: mobile, amount: amount, method: 'MOMO', source: 'USSD', withdrawal: false, reference: 'Deposit to Account Number ' + account.code, merchantid: account.merchantid };
		await postDeposit(data, async (result) => {
			// console.log(result) 
			// menu.end(JSON.stringify(result)); 
			let message = 'Payment request of amount GHC ' + amount + ' has been sent to your phone.';
			if (network == "MTN") {
				message+="\nIf you don't get the prompt after 20 seconds, kindly dial *170# >> My Wallet >> My Approvals and approve payment"
			}
			menu.end(message);
		});
	}
})

///////////////--------------CHECK STATUS STARTS--------------////////////////

menu.state('checkpolicy', {
	run: async () => {
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
	let args = req.body;
	if (args.Type == 'initiation') {
		args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
	}
	menu.run(args, ussdResult => {
		menu.session.set('network', args.Operator);
		res.send(ussdResult);
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
				return await callback(resp);
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

			return await callback(response);
		});
	// }
	// catch(err) {
	//     console.log(err);
	//     return err;
	// }
}


async function postDeposit(val, callback) {
	var api_endpoint = apiurl + 'Deposit/' + access.code + '/' + access.key;
	var req = unirest('POST', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.send(JSON.stringify(val))
		.end(async (resp) => {
			console.log(JSON.stringify(val));
			if (resp.error) {
				console.log(resp.error);
				await postDeposit(val);
				return await callback(resp);
			}
			// if (res.error) throw new Error(res.error); 
			// console.log(resp.raw_body);
			var response = JSON.parse(resp.raw_body);
			console.log(response);
			return await callback(response);
		});
	return true
}
