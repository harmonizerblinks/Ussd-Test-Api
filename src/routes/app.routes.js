module.exports = function(app) {

    var apps = require('../controllers/ppt/ppt.app.controller.js');
    // var contact = require('../controllers/mail.controller.js');
    var ussd = require('../controllers/ussd.controller.js');
    const verify = require('../middleware/verifyJwtToken.middleware.js');
    // const user = require('../middleware/verifysignup.middleware.js');

    // Register 
    // app.post('/api/register', apps.createUser);

    // App user Login
    app.post('/app/login', apps.login);

    // Logout
    app.get('/app/logout', verify.verifyToken, apps.logout);

    app.post('/app/send-otp', apps.sendOtp);
    app.post('/app/verify-otp', apps.verifyOtp);
    // Change Password
    app.post('/app/set-pin', apps.setPassword);
    
    // Change Password
    app.post('/app/change-pin', verify.verifyToken, apps.changePassword);

    // Retrieve user Detail
    app.get('/app/getMember/:mobile', apps.getMember);
    app.get('/app/getMemberinfo', verify.verifyToken, apps.getMemberinfo);
    app.get('/app/getScheme/:scheme', verify.verifyToken, apps.getScheme);
    app.get('/app/getSchemeinfo/:scheme', verify.verifyToken, apps.getSchemeinfo);
    app.get('/app/getMiniStatement/:scheme', verify.verifyToken, apps.getMemberinfo);
    app.post('/app/Statement', verify.verifyToken, apps.Statement);
    // Retrieve user Detail
    app.get('/app/profile', verify.verifyToken, apps.profile);
    
    // Payment
    app.post('/app/payment', verify.verifyToken, apps.Deposit);

}