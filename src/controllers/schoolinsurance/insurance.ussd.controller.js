const UssdMenu = require('ussd-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu({ provider: 'hubtel' });
let sessions = {};
const apiurl = "https://app.alias-solutions.net:5012/Ussd/";
// let access = { code: "ACU001", key: "1029398" };
let access = { code: "ENTLIFE", key: "1029398" };
let helpers = require('../../utils/helpers')
let school_types = ["Private", "Public"];
let school_policies = ["Up To J.H.S", "Up To S.H.S", "Up To University"];
let claim_types = ["Death", "Redundancy", "Critical illness", "Permanent TT Disability", "Maintenance Allowance", "Accidental Injury"];
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
		await fetchParent(menu.args.phoneNumber,
			(response) => {
				if (response.active) {
					menu.con('Welcome to Saham Educational Policy\n' +
						'1. Subscribe\n' +
						'2. Payment\n' +
						'3. Policies\n' +
						'4. Claims\n'
					)
				}
				else {
					menu.end('Please activate your account first')
				}
			},
			(error) => {
				menu.con('Welcome to Saham Educational Policy\nPress (0) zero to register as a parent\n0. Register')
			})
	},
	next: {
		'0': 'Register',
		'1': 'Subscribe',
		'2': 'Payment',
		'3': 'Policies',
		'4': 'Claims'
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
		'*[a-zA-Z]+': 'Register.Confirm',
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

		menu.con('Please confirm your registration\nName: ' + fullname + '\nDOB: ' + dob + '\nProfession: ' + profession + '\nWorkplace: ' + menu.val +
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
		var mobile = menu.args.phoneNumber;

		var fullname = "";
		if (firstname && lastname) {
			fullname = firstname + ' ' + lastname;
		}
		else {
			fullname = 'customer';
		}

		var parent = {
			fullname: fullname, firstname: firstname, lastname: lastname, mobile: mobile, email: "alias@gmail.com", gender: "N/A", source: "USSD", network: menu.args.operator, location: 'n/a', date_of_birth: dob, profession: profession, place_of_work: workplace
		};

		await Register(parent, (response) => {
			menu.end('Thank you for registering, ' + fullname + '\nYour registration has been submitted successfully');
		}, (error) => {
			menu.end(error.message || 'Registration not Successful')
		})

		// menu.end('Thank you for registering, ' + fullname + '\nYour registration has been submitted successfully')
	},
});
///////////////--------------END REGISTRATION--------------////////////////


///////////////--------------START SUBSCRIBE--------------////////////////

menu.state('Subscribe', {
	run: async () => {
		menu.con(
			'Please enter student\'s first name'
		);
	},
	next: {
		'*[a-zA-Z]+': 'Subscribe.Firstname'
	}
})

menu.state('Subscribe.Firstname', {
	run: async () => {

		menu.session.set('firstname', menu.val);
		menu.con(
			'Please enter student\'s last name'
		);
	},
	next: {
		'*[a-zA-Z]+': 'Subscribe.Lastname'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Lastname', {
	run: async () => {
		menu.session.set('lastname', menu.val);
		menu.con(
			'Please enter student\'s date of birth \nFormat: YYYY/MM/DD , Example: 1984/02/27'
		);
	},
	next: {
		'*[0-9]+': 'Subscribe.DOB'
	},
	defaultNext: 'IncorrectInput'
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
			the_message += `${(Number(index + 1))}. ${element}\n`;
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

		await AvailablePolicyTypes(schoolType, (policies) => {
            if (policies && policies.length > 0) {

				menu.session.set('school_policies', policies);
				
                policies.forEach((element, index) => {
					the_message += `${(Number(index + 1))}. ${element.name}\n`;
                });
                menu.con(the_message)
            } else {
                menu.end('No policy types available');
            }
        }, 
		(error) => {
			menu.end(error.message || 'Could not retrieve policies')
		})
		
	},
	next: {
		'*[1-9]': 'Subscribe.Stage'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Stage', {
	run: async () => {

		let school_policies = await menu.session.get('school_policies');
		let policy = school_policies[Number(menu.val - 1)];
		menu.session.set('policy', policy);
		if (!policy) {
			return menu.end("You did not select a valid policy");
		}
		
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
		let firstname = await menu.session.get('firstname');
		let lastname = await menu.session.get('lastname');
		let student_dob = await menu.session.get('student_dob');
		let school_name = await menu.session.get('school_name');
		let school_type = await menu.session.get('school_type');
		let policy = await menu.session.get('policy');

		let the_message = "Display Details\n";
		menu.con(`${the_message}Name: ${firstname} ${lastname}\nDOB: ${student_dob}\nSchool: ${school_name}\nClass/Stage: ${menu.val}\nAmnt: ${policy.amount}\n` +
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

		let firstname = await menu.session.get('firstname');
		let lastname = await menu.session.get('lastname');
		let student_dob = await menu.session.get('student_dob');
		let school_name = await menu.session.get('school_name');
		let school_type = await menu.session.get('school_type');
		let school_stage = await menu.session.get('school_stage');
		let policy = await menu.session.get('policy');

		var student = {
			code: access.code, key: access.key,
			firstname: firstname, lastname: lastname, mobile: menu.args.phoneNumber, email: "alias@gmail.com", network: menu.args.operator, amount: policy.amount, dateofbirth: student_dob,
			// school: school.name,schoolCode: school.code, 
			school: school_name,
			other: "n/a", grade: school_stage, accountcode: policy.code, gender: "N/A", source: "USSD", location: 'n/a', agentcode: 'n/a', maritalstatus: 'n/a', idnumber: 'n/a', idtype: 'n/a',
		};

		await Subcription(student, (response) => {
			menu.end('Thank you for subscribing')
		}, (error) => {
			console.log(error)
			menu.end((error && error.message) ? error.message : 'Subscription not successful')
		})
	},
});

///////////////--------------END SUBSCRIBE--------------////////////////




///////////////--------------START PAYMENT--------------////////////////

menu.state('Payment', {
	run: async () => {

		await fetchParentChildren(helpers.formatPhoneNumber(menu.args.phoneNumber),
			async (response) => {
				if (response && response.length > 0) {
					menu.session.set('students_list', response);
					let the_message = "Please select a student\n";
					response.forEach((element, index) => {
						the_message += `${(Number(index + 1))}. ${element.fullname}\n`;
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

		var parent = {
			index: menu.val,
			mobile: menu.args.phoneNumber,
		}
		await fetchParentChild(parent,
			async (response) => {
				if (response && response.active) {
					menu.session.set('policy', response);
					menu.session.set('selected_student', student);
					menu.con(
						'Display Details\n' +
						`Name: ${student.fullname}\n` +
						'1. Proceed \n' +
						'2. Change Policy \n' +
						'3. Cancel \n'
					);
				}
				else {
					menu.end('Sorry student does not exist');
				}
			},
			(error) => {
				menu.end('Sorry could not retrieve student\'s details'
				)
			})
	},
	next: {
		'1': 'Payment.Proceed',
		'2': 'Payment.ChangePolicy',
		'3': 'Cancel'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Payment.Proceed', {
	run: async () => {

		let policy = await menu.session.get('policy');
		var customer = {
			account: policy.policynumber,
			source: "USSD", amount: policy.amount, mobile: menu.args.phoneNumber, netWork: menu.args.operator, method: "Momo", reference: "Payment",
		};
		await postDeposit(customer, (response) => {
			menu.end(
				'Please authorize the payment on your phone'
			);
		}, (error) => {
			menu.end(error.message || 'Payment not successful')
		})
		
	}
})

menu.state('Payment.ChangePolicy', {
	run: async () => {
		let the_message = "Please select type of school\n";
		school_types.forEach((element, index) => {
			the_message += `${(Number(index + 1))}. ${element}\n`;
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

		await AvailablePolicyTypes(schoolType, (policies) => {
            if (policies && policies.length > 0) {
				menu.session.set('school_policies', policies);
				let the_message = "Please select school policy\n";
                policies.forEach((element, index) => {
					the_message += `${(Number(index + 1))}. ${element.name}\n`;
                });
                menu.con(the_message)
            } else {
                menu.end('No policy types available');
            }
        }, 
		(error) => {
			menu.end(error.message || 'Could not retrieve policies')
		})
		
	},
	next: {
		'*[1-2]': 'Payment.ChangePolicy.Policy'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Payment.ChangePolicy.Policy', {
	run: async () => {
		
		let school_policies = await menu.session.get('school_policies');
		let school_policy = school_policies[Number(menu.val - 1)];
		menu.session.set('school_policy', school_policy);
		if (!school_policy) {
			return menu.end("You did not select a valid policy");
		}
		menu.con('Please enter class/stage');
	},
	next: {
		'*[a-zA-Z]+': 'Payment.ChangePolicy.ClassStage' 
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Payment.ChangePolicy.ClassStage', {
	run: async () => {

		menu.session.set('school_stage', menu.val);
		let school_type = await menu.session.get('school_type');
		let school_policy = await menu.session.get('school_policy');

		let the_message = "Display Details\n";
		menu.con(`${the_message}School Type: ${school_type}\nPolicy: ${school_policy.name}\nClass/Stage: ${menu.val}\nAmnt: ${school_policy.amount}\n` +
			`1. Confirm\n2. Cancel`
		);

	},
	next: {
		'1': 'Payment.ChangePolicy.Submit',
		'2': 'Cancel'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Payment.ChangePolicy.Submit', {
	run: async () => {

		let school_type = await menu.session.get('school_type');
		let school_policy = await menu.session.get('school_policy');
		let policy = await menu.session.get('policy');
		let school_stage = await menu.session.get('school_stage');
		let selected_student = await menu.session.get('selected_student');

		var student_policy = {
			stundentNumber: selected_student.studentnumber, policyNumber: school_policy.code , accountCode: policy.policynumber, grade: school_stage,
			source: "USSD", mobile: menu.args.phoneNumber, amount: school_policy.amount, network: menu.args.operator
		};
		console.log(student_policy)
		await ChangePolicy(student_policy, (response) => {
			menu.end('Policy change successful\n');
		}, (error) => {
			console.log(error)
			menu.end( (error && error.message) ? error.message : 'Sorry, policy could not be updated')
		})


	}
})

///////////////--------------END PAYMENT--------------////////////////




///////////////--------------START POLICIES--------------////////////////

menu.state('Policies', {
	run: async () => {

		let the_message = "Please select type of school\n";
		school_types.forEach((element, index) => {
			the_message += `${(Number(index + 1))}. ${element}\n`;
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

		await AvailablePolicyTypes(schoolType, (policies) => {
            if (policies && policies.length > 0) {
				menu.session.set('school_policies', policies);
				let the_message = "Please select type of school policy\n";
                policies.forEach((element, index) => {
					the_message += `${(Number(index + 1))}. ${element.name}\n`;
                });
                menu.con(the_message)
            } else {
                menu.end('No policy types available');
            }
        }, 
		(error) => {
			menu.end(error.message || 'Could not retrieve policies')
		})

		// let the_message = "Please select type of school policy\n";
		// school_policies.forEach((element, index) => {
		// 	the_message += `${(Number(index + 1))}. ${element}\n`;
		// });
		// menu.con(the_message)

	},
	next: {
		'*[1-9]': 'Policies.Policy'
	},
})


menu.state('Policies.Policy', {
	run: async () => {
		
		let school_policies = await menu.session.get('school_policies');
		let policy = school_policies[Number(menu.val - 1)];
		menu.session.set('policy', policy);
		if (!policy) {
			return menu.end("You did not select a valid policy");
		}
		
		menu.end(`Name: ${policy.name}\n` +
		`Amount: ${policy.amount}\n` +
		`Limit: ${policy.limit}\n` +
		`Frequency: ${policy.frequency}\n` +
		`Description: ${policy.description}\n`
		)
	},
})

///////////////--------------END POLICIES--------------////////////////



///////////////--------------START CLAIMS--------------////////////////

menu.state('Claims', {
	run: async () => {
		let the_message = "Please select a claim\n";
		claim_types.forEach((element, index) => {
			the_message += `${(Number(index + 1))}. ${element}\n`;
		});
		menu.con(the_message);
	},
	next: {
		'*[1-6]': 'Claims.Select'
	},
})

menu.state('Claims.Select', {
	run: async () => {

		let claim_type = claim_types[Number(menu.val) - 1];
		menu.session.set('claim_type', claim_type);

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


//////////-------------API FUNCTION--------------//////////////
async function getInfo(mobile, callback, errorCallback) {
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

async function fetchParent(val, callback, errorCallback) {
	// if (val && val.startsWith('+233')) {
	// 	// Remove Bearer from string
	// 	val = val.replace('+233', '0');
	// }
	var api_endpoint = apiurl + 'getParent/' + access.code + '/' + access.key + '/' + val;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp);
			}
			var response = JSON.parse(resp.raw_body);
			return await callback(response);
		});
}


async function fetchParentChildren(mobile, callback, errorCallback) {
	// var api_endpoint = `https://app.alias-solutions.net:5011/getInfo/${access.code}/${access.key}/${mobile}`
	var api_endpoint = `${apiurl}GetParentChildren/${access.code}/${access.key}/${mobile}`;
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

async function fetchParentChild(val, callback, errorCallback) {

	var api_endpoint = apiurl + 'getParentChild/' + access.code + '/' + access.key + '/' + val.mobile + '/' + val.index;
	console.log(api_endpoint);
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				// console.log(resp.error);
				// var response = JSON.parse(res);
				// return res;
				return await errorCallback(resp.body);
			}
			// console.log(resp.raw_body);
			// var response = JSON.parse(resp.raw_body);

			return await callback(resp.body);
		});
}

async function AvailablePolicyTypes(val, callback, errorCallback ) {
	var api_endpoint = apiurl + 'AvailablePolicyTypes/' + val + '?appid=' + access.code + '&key=' + access.key;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp);
			}
			var response = JSON.parse(resp.raw_body);

			return await callback(response);
		});
}

async function AvailablePolicyType(val, callback) {
	// var api_endpoint = apiurl + 'AvailablePolicyType/' + access.code+'/'+access.key + '/' + val.mobile+ '/' + val.index;
	var api_endpoint = apiurl + 'AvailablePolicyType/' + val.type + '/' + val.index + '?appid=' + access.code + '&key=' + access.key;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				// var response = JSON.parse(res);
				// return res;
				return await callback(resp);
			}
			var response = JSON.parse(resp.raw_body);

			return await callback(response);
		});
}

async function postDeposit(val, callback, errorCallback) {
	var api_endpoint = apiurl + 'Deposit/' + access.code + '/' + access.key;
	var req = unirest('POST', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.send(JSON.stringify(val))
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp);
			}
			// if (res.error) throw new Error(res.error);
			var response = JSON.parse(resp.raw_body);
			return await callback(response);
		});
}

async function Register(val, callback, errorCallback) {

	var api_endpoint = `${apiurl}RegisterParent/${access.code}/${access.key}`
	var req = unirest('POST', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.send(JSON.stringify(val))
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp.body);
			}
			return await callback(resp.body);
		});
	return true
}

async function Subcription(val, callback, errorCallback) {

	var api_endpoint = `${apiurl}RegisterStudent/${access.code}/${access.key}`;
	var req = unirest('POST', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.send(JSON.stringify(val))
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp.body);
			}
			return await callback(resp.body);
		});
}

async function ChangePolicy(val, callback, errorCallback) {

	var api_endpoint = `${apiurl}ChangeStudentPolicy/${access.code}/${access.key}`;
	var req = unirest('POST', api_endpoint)
		.headers({
			'Content-Type': 'application/json'
		})
		.send(JSON.stringify(val))
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp.body);
			}
			return await callback(resp.body);
		});
}
