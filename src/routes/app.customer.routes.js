module.exports = function(app) {

    var apps =  require('../controllers/app.customer.controller');
    const verify = require('../middleware/verifyJwtToken.middleware');

    // App user Login
    app.post('/customer/login', apps.login);
    // app user registration
    app.post('/customer/register', apps.createCustomer);
    app.post('/customer/create-customer', apps.createCustomer);
    // Logout
    app.get('/customer/logout', verify.verifyToken, apps.logout);
    app.get('/customer/profile', verify.verifyToken, apps.profile);
    app.post('/customer/upload-photo', verify.verifyToken, apps.uploadProfilePhoto);
    // Validate customer Mobile
    app.get('/customer/validate/:merchant/:mobile', apps.validateCustomer);
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
    app.post('/customer/deposit',verify.verifyToken, apps.Deposit);
    app.post('/customer/withdrawal',verify.verifyToken, apps.Withdraw);
    app.get('/customer/transactions/:account',verify.verifyToken, apps.getTransactions);
    app.post('/customer/transfer', verify.verifyToken, apps.transfer);
    app.get('/customer/verifyMobile/:mobile', verify.verifyToken, apps.getInfo);
    app.get('/customer/validateAccount/:account', verify.verifyToken, apps.validateAccountNumber);
}