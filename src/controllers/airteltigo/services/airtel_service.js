const apiurl = "http://127.0.0.1:8000/api/";
var unirest = require('unirest');
exports.randomBoolean = () => {
    return Math.random() < 0.5;
};

exports.fetchCustomer = async (val, access, callback, errorCallback) => {
    // try {
    if (val && val.startsWith('+233')) {
        // Remove Bearer from string
        val = val.replace('+233', '0');
    }
    var api_endpoint = apiurl + 'getCustomer/' + access.code + '/' + access.key + '/' + val;
    var request = unirest('GET', api_endpoint)
        .end(async (resp) => {
            if (resp.error) {
                // console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await errorCallback(resp.body);
            }
            else {
                await callback(resp.body);
            }

        });
}

exports.postChangePin = async (customer, access, callback, errorCallback) => {

    var api_endpoint = `${apiurl}postChangePin/${access.code}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .send(JSON.stringify(customer))
        .end(async (resp) => {
            if (resp.error) {
                // console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await errorCallback(resp.body);
            }
            else {
                await callback(resp.body);
            }

        });
}

exports.postChangePin = async (customer, callback, errorCallback) => {

    var api_endpoint = `${apiurl}postChangePin/${access.code}/${access.key}`;
    var request = unirest('POST', api_endpoint)
        .send(JSON.stringify(customer))
        .end(async (resp) => {
            if (resp.error) {
                // console.log(resp.error);
                // var response = JSON.parse(res);
                // return res;
                await errorCallback(resp.body);
            }
            else {
                await callback(resp.body);
            }

        });
}