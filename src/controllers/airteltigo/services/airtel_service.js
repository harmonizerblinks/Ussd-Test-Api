// const apiurl = "https://app.alias-solutions.net:5003/Ussd/";
var unirest = require('unirest');
exports.randomBoolean = () => {
    return Math.random() < 0.5;
};

exports.fetchCustomer = async (apiurl, mobile_num, merchant, access, callback, errorCallback) => {
    // try {
    var api_endpoint = `${apiurl}getCustomer/${merchant}/${access.key}/${mobile_num}`;
    var request = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp.body);
            }
            else {
                return await callback(resp.body);
            }

        });
}

exports.postChangePin = async (apiurl, customer, merchant, access, callback, errorCallback) => {

    var api_endpoint = `${apiurl}Change/${merchant}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .send(JSON.stringify(customer))
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

exports.CreateCustomer = async (apiurl, customer, merchant, access, callback, errorCallback) => {

    var api_endpoint = `${apiurl}CreateCustomer/${merchant}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(customer))
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp.body);
            }
            else {
                return await callback(resp.body);
            }

        });
}

exports.getInfo = async (apiurl, appid, key, mobile, callback, errorCallback) => {
    var api_endpoint = `${apiurl}getInfo/${appid}/${key}/${mobile}`;
    // console.log(api_endpoint);
    var req = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                // return res;
                return await errorCallback(resp.body);
            }
            return await callback(resp.body);
        });
}

exports.getCustomerAccount = async (apiurl, merch, key, mobile, index, callback, errorCallback) => {
    var api_endpoint = `${apiurl}getCustomerPersonalAccount/${merch}/${key}/${mobile}/${index}`;
    var req = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                // return res;
                return await errorCallback(resp.body);
            }
            return await callback(resp.body);
        });

}

exports.CreateCustomerAccount = async (apiurl, customer, merchant, access, callback, errorCallback) => {

    var api_endpoint = `${apiurl}CreateCustomer/${merchant}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(customer))
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp.body);
            }
            else {
                return await callback(resp.body);
            }

        });
}

exports.Deposit = async (apiurl, customer, merchant, access, callback, errorCallback) => {

    var api_endpoint = `${apiurl}Deposit/${merchant}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .send(JSON.stringify(customer))
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

exports.Withdrawal = async (apiurl, customer, merchant, access, callback, errorCallback) => {

    var api_endpoint = `${apiurl}Withdrawal/${merchant}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .send(JSON.stringify(customer))
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

exports.GetBalance = async (apiurl, account, merchant, callback, errorCallback) => {

    var api_endpoint = `${apiurl}GetBalance/${merchant}/${account}`;
    var request = unirest('GET', api_endpoint)
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

exports.getAccountTransaction = async (apiurl, merchant, access, accountcode, callback, errorCallback) => {

    var api_endpoint = `${apiurl}getAccountTransaction/${merchant}/${access.key}/${accountcode}`;
    var request = unirest('GET', api_endpoint)
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

exports.getGroup = async (apiurl, merch, key, code, callback, errorCallback) => {
    var api_endpoint = `${apiurl}getGroup/${merch}/${key}/${code}`;
    var req = unirest('GET', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .end(async (resp) => {
            // if (res.error) throw new Error(res.error); 
            if (resp.error) {
                // return res;
                return await errorCallback(resp.body);
            }
            return await callback(resp.body);
        });
}

exports.AddCustomerToGroup = async (apiurl, merchant, key, groupCode, customer , callback, errorCallback) => {
    
    var api_endpoint = `${apiurl}AddCustomerToGroup/${merchant}/${key}/${groupCode}`;
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(customer))
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp.body);
            }
            else {
                return await callback(resp.body);
            }

        });
}

exports.CreateGroup = async (apiurl, merchant, key, group, callback, errorCallback) => {
    
    var api_endpoint = `${apiurl}CreateGroup/${merchant}/${key}`;
    var request = unirest('POST', api_endpoint)
        .headers({
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify(group))
        .end(async (resp) => {
            if (resp.error) {
                return await errorCallback(resp.body);
            }
            else {
                return await callback(resp.body);
            }

        });
}