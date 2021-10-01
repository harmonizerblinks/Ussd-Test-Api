const apiurl = "https://app.alias-solutions.net:5003/Ussd/";
// const apiurl = "http://localhost:4041/api/";
var unirest = require('unirest');
exports.randomBoolean = () => {
    return Math.random() < 0.5;
};

exports.fetchCustomer = async (mobile_num, merchant, access, callback, errorCallback) => {
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

exports.postChangePin = async (customer, merchant, access, callback, errorCallback) => {

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

exports.CreateCustomer = async (customer, merchant, access, callback, errorCallback) => {

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

exports.getInfo = async (appid, key, mobile, callback, errorCallback) => {
    var api_endpoint = `${apiurl}getInfo/${appid}/${key}/${mobile}`;
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