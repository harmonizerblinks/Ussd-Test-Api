module.exports = function(app) {

    var apps =  require('../controllers/app.controller');
    const verify = require('../middleware/verifyJwtToken.middleware');
    // const user = require('../middleware/verifysignup.middleware.js');

    // App user Login
    app.post('/officer/login', apps.login);
    // Logout
    app.get('/officer/app/logout', verify.verifyToken, apps.logout);

    // Validate Officer Mobile With Merchant Code
    app.post('/officer/validate/:merchant/:mobile', apps.validateOfficer);
    // Send Otp to Officer
    app.post('/officer/send-otp', apps.sendOtp);
    // Verifiy Otp Input with Otp Sent to Officer
    app.post('/officer/verify-otp', apps.verifyOtp);
    // Set officer Password
    app.post('/officer/set-pin', apps.setPassword);
    // Change Officer Password
    app.post('/officer/change-pin', verify.verifyToken, apps.changePassword);
    //get merchants
    app.get('/officer/getMerchants',  verify.verifyToken, apps.getMerchants);
    app.post('/officer/getOfficer', verify.verifyToken, apps.getOfficer);
    app.get('/officer/getAccounts', verify.verifyToken, apps.getAccounts);
    app.get('/officer/get-groups', verify.verifyToken, apps.getOfficerGroups);
    app.get('/officer/transaction/:id', verify.verifyToken, apps.getOfficerGroups);
    app.post('/officer/create-transaction/:merchant', verify.verifyToken, apps.createTransaction);
    app.get('/officer/getCustomerAccounts', verify.verifyToken, apps.getCustomers)
   
}