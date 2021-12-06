const UssdMenu = require('ussd-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu({ provider: 'hubtel' });
let sessions = {};
const apiurl = "https://api.paynowafrica.com/";
let access = { code: "ACU001", key: "1029398" };
let helpers = require('../../utils/helpers')
let school_types = ["Private", "Public"];
let school_policies = ["Up To J.H.S", "Up To S.H.S", "Up To University"];
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
		await fetchCustomer(menu.args.phoneNumber,
			(response) => {
				if(response.active)
				{
					menu.con(`Welcome to Saham Educational Policy\n
					1. Subscribe
					2. Payment
					3. Policies
					4. Claims
					`)
				}
				else
				{
					menu.end('Please activate your account first')
				}
			},
			(error) => {
				menu.con('Welcome to Saham Educational Policy\nPress (0) zero to register as a parent\n0. Register')
			})
	},
	next: {
		'0': 'Register',
		'1': 'Payment',
		'2': 'checkpolicy',
		'3': 'Claims'
	}
})

///////////////--------------REGISTRATION--------------////////////////


menu.state('Register', {
	run: async () => {

		await getInfo(menu.args.phoneNumber,
			(response) => {
				if (response.firstname && response.lastname) {
					menu.session.set('firstname', response.firstname)
					menu.session.set('lastname', response.lastname)
				}
				else {
					menu.session.set('firstname', "N/A")
					menu.session.set('lastname', "N/A")
				}
				menu.con(
					'Please confirm person\'s details\n' +
					'First name: ' + response.firstname + '\n' +
					'Last name: ' + response.lastname + '\n' +
					'\n0. Make Changes' +
					'\n1. Continue'
				)
			},
			(error) => {
				menu.end('Sorry, could not retrieve your details');
			})
	},
	next: {
		'0': 'Register.Change',
		'1': 'Register.DOB',
	}
})

menu.state('Register.Change', {
	run: () => {
		menu.con('Please enter first name')
	},
	next: {
		'*[a-zA-Z]+': 'Register.firstname'
	}
});

menu.state('Register.firstname', {
	run: () => {
		let firstname = menu.val;
		menu.session.set('firstname', firstname);
		menu.con('Please enter last name')
	},
	next: {
		'*[a-zA-Z]+': 'Register.lastname'
	},
	defaultNext: 'IncorrectInput'
})


menu.state('Register.lastname', {
	run: async () => {
		let lastname = menu.val;
		menu.session.set('lastname', lastname);
		var firstname = await menu.session.get('firstname');
		menu.con('Please confirm the Person\'s details' +
			'\nFirst Name - ' + firstname +
			'\nLast Name - ' + lastname +
			'\n\n0. Make Changes' +
			'\n1. Continue')
	},
	next: {
		'0': 'Register.change',
		'1': 'Register.DOB',
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Register.DOB', {
	run: () => {
		menu.con('Please enter Your Date of Birth \nFormat: YYYY/MM/DD , Example: 1984/12/30')
	},
	next: {
		'*[0-9]+': 'Register.Profession',
	},
	defaultNext: 'IncorrectInput'
});

menu.state('Register.Profession', {
	run: () => {
		if (helpers.isValidDate(menu.val)) {
			menu.session.set('dob', menu.val);
			menu.con('Please enter profession')
		}
		else {
			menu.end('You entered an invalid date, please try again later')
		}

	},
	next: {
		'*[a-zA-Z]+': 'Register.Workplace',
	},
	defaultNext: 'IncorrectInput'
});

menu.state('Register.Workplace', {
	run: () => {
		menu.session.set('profession', menu.val);
		menu.con('Please enter place of work')
	},
	next: {
		'*[a-zA-Z]+': 'Register.Workplace',
	},
	defaultNext: 'IncorrectInput'
});

menu.state('Register.Confirm', {
	run: async () => {
		menu.session.set('workplace', menu.val);

		var firstname = await menu.session.get('firstname');
		var lastname = await menu.session.get('lastname');
		var dob = await menu.session.get('dob');
		var profession = await menu.session.get('profession');
		var fullname = "";
		if (firstname && lastname) {
			fullname = firstname + ' ' + lastname;
		}
		else {
			fullname = 'customer';
		}

		menu.con('Please confirm your registration\nName: ' + fullname + '\nDOB: ' + dob + '\nProfession: ' + profession + 'Workplace: ' + menu.val +
			'\n1. Confirm' +
			'\n2. Cancel')
	},
	next: {
		'1': 'Register.Submit',
		'2': 'Cancel',
	},
	defaultNext: 'IncorrectInput'
});

menu.state('Register.Submit', {
	run: async () => {
		var firstname = await menu.session.get('firstname');
		var lastname = await menu.session.get('lastname');
		var dob = await menu.session.get('dob');
		var profession = await menu.session.get('profession');
		var workplace = await menu.session.get('workplace');
		var mobile = menu.args.phoneNumber ;
		
		var fullname = "";
		if (firstname && lastname) {
			fullname = firstname + ' ' + lastname;
		}
		else {
			fullname = 'customer';
		}

		var customer = {
            code: access.code, key: access.key,
            fullname: fullname, mobile: mobile, email: "alias@gmail.com", gender: "N/A", source: "USSD", network: menu.args.operator, location: 'n/a', agentcode: 'n/a', matrialstatus: 'n/a', idnumber: 'n/a', idtype: 'n/a', dateofbirth: dob, profession: profession, workplace: workplace
        };

		await postCustomer(customer, (response) => {
			menu.end('Thank you for registering, ' + fullname + '\nYour registration has been submitted successfully');
        }, (error) => {
            menu.end(error.message || 'Registration not Successful')
        })

		menu.end('Thank you for registering, ' + fullname + '\nYour registration has been submitted successfully')
	},
});
///////////////--------------END REGISTRATION--------------////////////////


///////////////--------------START SUBSCRIBE--------------////////////////

menu.state('Subscribe', {
	run: async () => {
		menu.con(
			'Please enter student\'s name'
		);
	},
	next: {
		'*[a-zA-Z]+': 'Subscribe.Name'
	}
})

menu.state('Subscribe.Name', {
	run: async () => {
		menu.session.set('name', menu.val);
		menu.con(
			'Please enter student\'s dat of birth \nFormat: YYYY/MM/DD , Example: 1984/12/30'
		);
	},
	next: {
		'*[0-9]+': 'Subscribe.DOB'
	}
})

menu.state('Subscribe.DOB', {
	run: async () => {
		if (helpers.isValidDate(menu.val)) {
			menu.session.set('student_dob', menu.val);
			menu.con(
				'Please enter the school\'s name'
			);

		}
		else {
			menu.end('You entered an invalid date, please try again later')
		}
	},
	next: {
		'*[a-zA-Z]+': 'Subscribe.Type'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Type', {
	run: async () => {
		menu.session.set('school_name', menu.val);
		let the_message = "Please select type of school\n";
		school_types.forEach((element, index) => {
			the_message += `${(index)}. ${element}\n`;
		});
		menu.con(the_message);
	},
	next: {
		'*[1-2]': 'Subscribe.Policy'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Policy', {
	run: async () => {

		let schoolType = school_types[Number(menu.val) - 1];
		menu.session.set('school_type', schoolType);

		let the_message = "Please select school policy\n";
		school_policies.forEach((element, index) => {
			the_message += `${(index)}. ${element}\n`;
		});
		menu.con(the_message)
	},
	next: {
		'*[1-3]': 'Subscribe.Stage'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Stage', {
	run: async () => {

		let schoolPolicy = school_policies[Number(menu.val) - 1];
		menu.session.set('school_policy', schoolPolicy);

		menu.con('Please enter class/stage');
	},
	next: {
		'*[a-zA-Z]+': 'Subscribe.Display'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Display', {
	run: async () => {

		menu.session.set('school_stage', menu.val);
		let name = await menu.session.get('name');
		let student_dob = await menu.session.get('student_dob');
		let school_name = await menu.session.get('school_name');
		let school_type = await menu.session.get('school_type');

		let the_message = "Display Details\n";
		menu.con(`${the_message}Name: ${name}\DOB: ${student_dob}\nSchool: ${school_name}\nClass/Stage: ${menu.val}\nAmnt:\n` +
			`1. Confirm\n2. Cancel\n#. Main Menu`
		);
	},
	next: {
		'1': 'Subscribe.Submit',
		'2': 'Cancel',
		'#': '__start__'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Submit', {
	run: async () => {
		
		let name = await menu.session.get('name');
		let student_dob = await menu.session.get('student_dob');
		let school_name = await menu.session.get('school_name');
		let school_type = await menu.session.get('school_type');
		let school_stage = await menu.session.get('school_stage');

		var customer = {
            code: access.code, key: access.key,
            fullname: fullname, mobile: mobile, email: "alias@gmail.com", gender: "N/A", source: "USSD", network: menu.args.operator, location: 'n/a', agentcode: 'n/a', matrialstatus: 'n/a', idnumber: 'n/a', idtype: 'n/a', dateofbirth: student_dob, name: name, school_name: school_name, school_type: school_type , school_stage: school_stage
        };

		await postCustomer(customer, (response) => {
			menu.end('Thank you for subscribing' )
        }, (error) => {
            menu.end(error.message || 'Registration not Successful')
        })
		// postCustomer
	},
});

///////////////--------------END SUBSCRIBE--------------////////////////




///////////////--------------START PAYMENT--------------////////////////

menu.state('Payment', {
	run: async () => {

		await getStudents(helpers.formatPhoneNumber(menu.args.phoneNumber),
			async (response) => {
				if (response && response.length > 0) {
					menu.session.set('students_list', response);
					let the_message = "Please select a student\n";
					response.forEach((element, index) => {
						the_message += `${Number(index + 1)}. ${element.name}\n`;
					});
					menu.con(the_message);
				}
				else {
					menu.end('No students to display');
				}
			},
			(error) => {
				menu.end('Sorry could not retrieve students'
				)
			})
	},
	next: {
		'*[1-9]': 'Payment.Select'
	}
})

menu.state('Payment.Select', {
	run: async () => {
 
		let students_list = await menu.session.get('students_list');
        let student = students_list[Number(menu.val - 1)];
        if (!student) {
            return menu.end("You did not select a valid student");
        }

        menu.session.set('selected_student', student);
		menu.con(
			'Display Details\n' +
			`Name: ${student.name}\n` +
			'1. Proceed \n' +
			'2. Change Policy \n' +
			'3. Cancel \n'
		);
	},
	next: {
		'1': 'Payment.Proceed',
		'2': 'Payment.ChangePolicy',
		'2': 'Cancel'
	}
})

menu.state('Payment.Proceed', {
	run: async () => {
		menu.con(
			'Please authorize the payment on your phone'
		);
	}
})

menu.state('Payment.ChangePolicy', {
	run: async () => {
		let the_message = "Please select type of school\n";
		school_types.forEach((element, index) => {
			the_message += `${(index)}. ${element}\n`;
		});
		menu.con(the_message);
	},
	next: {
		'*[1-2]': 'Payment.ChangePolicy.SchoolType'
	}
})

menu.state('Payment.ChangePolicy.SchoolType', {
	run: async () => {
		let schoolType = school_types[Number(menu.val) - 1];
		menu.session.set('school_type', schoolType);

		let the_message = "Please select school policy\n";
		school_policies.forEach((element, index) => {
			the_message += `${(index)}. ${element}\n`;
		});
		menu.con(the_message)
	},
	next: {
		'*[1-2]': 'Payment.ChangePolicy.Policy'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Payment.ChangePolicy.Policy', {
	run: async () => {
		let schoolPolicy = school_policies[Number(menu.val) - 1];
		menu.session.set('school_policy', schoolPolicy);

		menu.con('Please enter class/stage');
	},
	next: {
		'*[1-2]': 'Payment.ChangePolicy.ClassStage'
	}
})

menu.state('Payment.ChangePolicy.ClassStage', {
	run: async () => {
		
		menu.session.set('school_stage', menu.val);
		let school_type = await menu.session.get('school_type');
		let school_policy = await menu.session.get('school_policy');

		let the_message = "Display Details\n";
		menu.con(`${the_message}Class/Stage: ${menu.val}\nAmnt:\n` +
			`1. Confirm\n2. Cancel`
		);
		
	},
	next: {
		'1': 'Payment.ChangePolicy.Confirm',
		'2': 'Cancel'
	}
})

menu.state('Payment.ChangePolicy.Submit', {
	run: async () => {
		
		let school_type = await menu.session.get('school_type');
		let school_policy = await menu.session.get('school_policy');
		let school_stage = await menu.session.get('school_stage');

		menu.end('Change successful');
		
	},
	next: {
		'1': 'Payment.ChangePolicy.Confirm',
		'2': 'Cancel'
	},
	defaultNext: 'IncorrectInput'
})

///////////////--------------END PAYMENT--------------////////////////




///////////////--------------START POLICIES--------------////////////////

menu.state('Policies', {
	run: async () => {

		let the_message = "Please select type of school\n";
		school_types.forEach((element, index) => {
			the_message += `${(index)}. ${element}\n`;
		});
		menu.con(the_message);
	},
	next: {
		'*[1-2]': 'Policies.Type'
	}
})

menu.state('Policies.Type', {
	run: async () => {

		let schoolType = school_types[Number(menu.val) - 1];
		menu.session.set('school_type', schoolType);

		let the_message = "Please select type of school policy\n";
		school_policies.forEach((element, index) => {
			the_message += `${(index)}. ${element}\n`;
		});
		menu.con(the_message)

	},
	next: {
		'*[1-3]': 'Policies.Policy'
	},
})


menu.state('Policies.Policy', {
	run: async () => {
		menu.end(`Death
		Redundancy
		Critical Illness...`)
	},
})

///////////////--------------END POLICIES--------------////////////////



///////////////--------------START CLAIMS--------------////////////////

menu.state('Claims', {
	run: async () => {
		menu.con(
			`Please select a claim\n` +
			`1. Death\n` +
			`2. Redundancy\n` +
			`3. Critical Illness\n`
		)
	},
	next: {
		'*[1-3]': 'Claims.Select'
	},
})

menu.state('Claims.Select', {
	run: async () => {
		menu.end(
			`Claim request received, our help desk will attend to you shortly\n`
		)
	},
	defaultNext: 'IncorrectInput'
})

///////////////--------------END CLAIMS--------------////////////////


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
		'0': '__start__',
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
				message += "\nIf you don't get the prompt after 20 seconds, kindly dial *170# >> My Wallet >> My Approvals and approve payment"
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
		'0': '__start__'
	}

})

///////////////--------------CLAIMS STARTS--------------////////////////

menu.state('claims', {
	run: () => {
		menu.end('Your request for claim was successful. You will be contacted shortly.')
	}
})


menu.state('IncorrectInput', {
	run: () => {
		menu.end('Sorry, incorrect input entered')
	},
});

menu.state('Cancel', {
	run: () => {
		menu.end('Thank you for using our service')
	},
});


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

async function fetchCustomer(val, callback, errorCallback) {
	// try {
	if (val && val.startsWith('+233')) {
		// Remove Bearer from string
		val = val.replace('+233', '0');
	}
	var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp);
			}
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


async function getInfo(mobile, callback, errorCallback) {
	// var api_endpoint = `https://app.alias-solutions.net:5011/getInfo/${access.code}/${access.key}/${mobile}`
	var api_endpoint = `${apiurl}getInfo/${access.code}/${access.key}/${mobile}`;
	var req = unirest('GET', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp.body);
			}
			return await callback(resp.body);
		});
}

async function postCustomer(customer, callback, errorCallback) {
    var api_endpoint = apiurl + 'CreatePolicyHolder/';
    var req = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(customer))
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp.body);
            }
            return await callback(resp.body);
        });
}

async function getStudents(mobile, callback, errorCallback) {
	// var api_endpoint = `https://app.alias-solutions.net:5011/getInfo/${access.code}/${access.key}/${mobile}`
	var api_endpoint = `${apiurl}getStudents/${access.code}/${access.key}/${mobile}`;
	var req = unirest('GET', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp.body);
			}
			return await callback(resp.body);
		});
}

exports.ussdApp = async (req, res) => {
	// Create a 
	let args = req.body;
	if (args.Type == 'initiation') {
		args.Type = req.body.Type.replace(/\b[a-z]/g, (x) => x.toUpperCase());
	}
	await menu.run(args, async (ussdResult) => {
		// if (args.Operator) { menu.session.set('network', args.Operator); }
		res.send(ussdResult);
	});
};