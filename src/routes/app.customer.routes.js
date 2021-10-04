module.exports = function(app) {

    var apps =  require('../controllers/app.customer.controller');
    const verify = require('../middleware/verifyJwtToken.middleware');

    // App user Login
    app.post('/customer/login', apps.login);
    // Logout
    app.get('/customer/logout', verify.verifyToken, apps.logout);
    app.get('/customer/profile', verify.verifyToken, apps.profile);
    app.post('/customer/upload-photo', verify.verifyToken, apps.uploadProfilePhoto);
    // Validate customer Mobile
    app.post('/customer/validate/:merchant/:mobile', apps.validateCustomer);
    // Send Otp to customer
    app.post('/customer/send-otp', apps.sendOtp);
    // Verifiy Otp Input with Otp Sent to customer
    app.post('/customer/verify-otp', apps.verifyOtp);
    // Set customer Pin
    app.post('/customer/set-pin', apps.setPassword);
    // Change customer Pin
    app.post('/customer/change-pin', verify.verifyToken, apps.changePassword);
    app.post('/customer/getCustomer', verify.verifyToken, apps.getCustomer);
    app.get('/customer/getAccounts', verify.verifyToken, apps.getAccounts);
    app.post('/customer/create-customer', verify.verifyToken, apps.createCustomer);
    app.post('/customer/deposit',verify.verifyToken, apps.Deposit);
}