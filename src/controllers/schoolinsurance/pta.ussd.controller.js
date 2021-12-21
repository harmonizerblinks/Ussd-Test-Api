const UssdMenu = require('ussd-builder');
const unirest = require('unirest');
const generator = require('generate-serial-number')
let menu = new UssdMenu({ provider: 'hubtel' });
let helpers = require('../../utils/helpers')
let school_types = ["Private", "Public"];
let school_policies = ["Up To J.H.S", "Up To S.H.S", "Up To University"];
let amount = 0.2;


// Test Credentials
// let apiurl = "https://localhost:5000/ussd";
let apiurl = "https://app.alias-solutions.net:5012/ussd/";
let access = { code: "ENTLIFE", key: "1029398" };

// Live Credential
// let apiurl = "https://app.alias-solutions.net:5013/";
// let access = { code: "ENTLIFE", key: "1029398" };


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


///////////////--------------MENU STARTS--------------////////////////

menu.startState({
	run: async () => {
		await fetchParent(menu.args.phoneNumber,
			(response) => {
				if (response.active) {
					menu.con(`Welcome to PTA School Insurance\n` +
						`1. Subscribe\n` +
						`2. Payment`)
				} else {
					menu.con('Welcome to PTA School Insurance\nPress (0) zero to register as a parent\n0. Register')
				}
			},
			(error) => {
				menu.con('Welcome to PTA School Insurance\nPress (0) zero to register as a parent\n0. Register')
			})
	},
	next: {
		'0': 'Register',
		'1': 'Subscribe',
		'2': 'Payment'
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
		'*[0-9]+': 'Register.Email',
	},
	defaultNext: 'IncorrectInput'
});

menu.state('Register.Email', {
	run: () => {
		if (helpers.isValidDate(menu.val)) {
			menu.session.set('dob', menu.val);
			menu.con('Please enter email')
		}
		else {
			menu.end('You entered an invalid date, please try again later')
		}

	},
	next: {
		'*[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$': 'Register.Confirm',
	},
	defaultNext: 'IncorrectInput'
});

menu.state('Register.Confirm', {
	run: async () => {

		if (helpers.isValidEmail(menu.val)) {
			menu.session.set('email', menu.val);

			var firstname = await menu.session.get('firstname');
			var lastname = await menu.session.get('lastname');
			var dob = await menu.session.get('dob');
			var email = await menu.session.get('email');
			var fullname = "";
			if (firstname && lastname) {
				fullname = firstname + ' ' + lastname;
			}
			else {
				fullname = 'customer';
			}

			menu.con('Please confirm your registration\nName: ' + fullname + '\nDOB: ' + dob + '\nEmail: ' + email +
				'\n1. Confirm' +
				'\n2. Cancel')
		}
		else {
			menu.end('You entered an invalid email address, please try again later')
		}
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
		var email = await menu.session.get('email');
		var mobile = menu.args.phoneNumber;
		var fullname = "";
		if (firstname && lastname) {
			fullname = firstname + ' ' + lastname;
		}
		else {
			fullname = 'customer';
		}

		var parent = {
			code: access.code, key: access.key,
			fullname: fullname, firstname: firstname, lastname: lastname, mobile: mobile, date_of_birth: dob, email: email, source: "USSD", network: menu.args.operator, profession: "N/A", gender: "N/A", place_of_work: 'n/a',
		};
		await Register(parent, (response) => {
			menu.con('Thank you for registering, ' + fullname + '\nYour registration was successful' +
				'\nPress (0) zero to Continue');
		}, (error) => {
			menu.end(error.message || 'Registration not Successful')
		})

	},
	next: {
		'0': '__start__',
		'*[0-9]': '__start__',
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
	}
})

menu.state('Subscribe.Lastname', {
	run: async () => {
		menu.session.set('lastname', menu.val);
		menu.con(
			'Please enter student\'s DOB \nFormat: YYYY/MM/DD , Example: 1984/12/30'
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
				'Please enter School Code'
			);
		}
		else {
			menu.end('You entered an invalid date, please try again later')
		}
	},
	next: {
		'*[0-9]+': 'Subscribe.School'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.School', {
	run: async () => {
		menu.session.set('school_code', menu.val);
		await fetchSchool(menu.val, (data) => {
			if (data.active) {
				menu.session.set('school', data);
				menu.con(
					'School Name: ' + data.name + '\n' +
					// 'School Name: Chemu\n'+
					'1. Continue\n2. Cancel'
				);
			} else {
				menu.end(
					'Please enter a valid School Code'
				);
			}
		}, (err) => {
			menu.end(
				'Please enter a valid School Code'
			);
		});
	},
	next: {
		'1': 'Subscribe.Stage',
		'2': 'Cancel'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Stage', {
	run: async () => {

		// const sch = await menu.session.get('school');
		// if(!sch) menu.end("Invalid school code provided, please try again.")

		menu.con('Please enter class/stage');
	},
	next: {
		'*[a-zA-Z]+': 'Subscribe.Display'
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Subscribe.Display', {
	run: async () => {

		menu.session.set('grade', menu.val);
		let firstname = await menu.session.get('firstname');
		let lastname = await menu.session.get('lastname');

		let dob = await menu.session.get('student_dob');
		// let school = await menu.session.get('school');

		let the_message = "Display Details\n";
		menu.con(`${the_message}Name: ${firstname} ${lastname}\nDOB: ${dob}\nClass/Stage: ${menu.val}\nAmount: GHS ${amount}\n` +
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
		let dob = await menu.session.get('student_dob');
		// let school_code = await menu.session.get('school_code');
		let school = await menu.session.get('school');
		let grade = await menu.session.get('grade');
		var mobile = menu.args.phoneNumber;

		var student = {
			code: access.code, key: access.key,
			firstname: firstname, lastname: lastname, mobile: mobile, email: "alias@gmail.com", network: menu.args.operator, amount: amount, dateofbirth: dob,
			// school: school.name,schoolCode: school.code, 
			school: "Chemu",
			other: "n/a", grade: grade, accountcode: "PTA", gender: "N/A", source: "USSD", location: 'n/a', agentcode: 'n/a', maritalstatus: 'n/a', idnumber: 'n/a', idtype: 'n/a',
		};

		await Subcription(student, (response) => {
			menu.end('Thank you for subscribing')
		}, (error) => {
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
						the_message += `${Number(index + 1)}. ${element.fullname}\n`;
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
		menu.session.set('student_index', menu.val);
		if (!student) {
			return menu.end("You did not select a valid student");
		}

		menu.session.set('selected_student', student);
		menu.con(
			'Display Details\n' +
			`Name: ${student.fullname}\n` +
			`Amount: ${amount}\n` +
			'1. Proceed\n' +
			'2. Cancel\n'
		);
	},
	next: {
		'1': 'Payment.Proceed',
		'2': 'Cancel',
	},
	defaultNext: 'IncorrectInput'
})

menu.state('Payment.Proceed', {
	run: async () => {

		let student_index = await menu.session.get('student_index');

		var parent = {
			index: student_index,
			mobile: menu.args.phoneNumber,
		}
		await fetchParentChild(parent,
			async (response) => {
				if (response && response.active) {
					var customer = {
						account: response.policynumber,
						source: "USSD", amount: amount, mobile: menu.args.phoneNumber, netWork: menu.args.operator, method: "Momo", reference: "Payment",
					};
					await postDeposit(customer, (response) => {
						menu.end(
							'Please authorize the payment on your phone'
						);
					}, (error) => {
						menu.end(error.message || 'Payment not successful')
					})
				}
				else {
					menu.end('Sorry student does not exist');
				}
			},
			(error) => {
				menu.end('Sorry could not retrieve student\'s details'
				)
			})
	}
})

///////////////--------------END PAYMENT--------------////////////////


///////////////-------------- ERRORS --------------////////////////
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

async function getInfo(mobile, callback, errorCallback) {
	// var api_endpoint = `https://app.alias-solutions.net:5011/getInfo/${access.code}/${access.key}/${mobile}`
	// var api_endpoint = `http://localhost:4041/api/getInfo/${access.code}/${access.key}/${mobile}`;
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


async function fetchSchool(val, callback, errorCallback) {

	var api_endpoint = apiurl + 'GetSchool/' + access.code + '/' + access.key + '/' + val;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp);
			}
			var response = JSON.parse(resp.raw_body);

			return await callback(response);
		});
}

async function fetchParent(val, callback, errorCallback) {

	var api_endpoint = apiurl + 'getParent/' + access.code + '/' + access.key + '/' + val;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp);
			}
			var response = JSON.parse(resp.raw_body);
			if (response.active) {
				// menu.session.set('limit', response.result.limit);
			}

			return await callback(response);
		});
}

async function fetchParentChild(val, callback, errorCallback) {

	var api_endpoint = apiurl + 'GetParentChild/' + access.code + '/' + access.key + '/' + val.mobile + '/' + val.index;
	var request = unirest('GET', api_endpoint)
		.end(async (resp) => {
			if (resp.error) {
				return await errorCallback(resp.body);
			}
			return await callback(resp.body);
		});
}

async function AvailablePolicyTypes(val, callback) {
	var api_endpoint = apiurl + 'AvailablePolicyTypes/' + val + '?appid=' + access.code + '&key=' + access.key;
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

async function ChangePolicy(mobile, callback, errorCallback) {

	var api_endpoint = `${apiurl}ChangeStudentPolicy/${access.code}/${access.key}`;
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