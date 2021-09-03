module.exports = function(app) {

    var apps = require('../controllers/ppt/ppt.app.test.controller.js');
    // var contact = require('../controllers/mail.controller.js');
    var ussd = require('../controllers/ussd.controller.js');
    const verify = require('../middleware/verifyJwtToken.middleware.js');
    // const user = require('../middleware/verifysignup.middleware.js');

    // Register 
    app.post('/test/register', apps.Register);

    // App user Login
    app.post('/test/login', apps.login);

    // Logout
    app.get('/test/logout', verify.verifyToken, apps.logout);

    app.post('/test/send-otp', apps.sendOtp);
    app.post('/test/verify-otp', apps.verifyOtp);
    // Change Password
    app.post('/test/set-pin', apps.setPassword);
    
    // Change Password
    app.post('/test/change-pin', verify.verifyToken, apps.changePassword);

    // Retrieve user Detail
    app.get('/test/getMember/:mobile', apps.getMember);
    app.get('/test/getMember/Personal/:mobile', apps.getMemberPersonal);
    app.get('/test/getinfo/:mobile', apps.getinfo);
    app.get('/test/getOccupations', verify.verifyToken, apps.getOccupations);
    app.get('/test/getRegions', verify.verifyToken, apps.getRegions);
    app.get('/test/getIdType', verify.verifyToken, apps.getIdType);
    app.get('/test/getMemberinfo', verify.verifyToken, apps.getMemberinfo);
    app.get('/test/getScheme/:scheme', verify.verifyToken, apps.getScheme);
    app.get('/test/getIcareAccounts', verify.verifyToken, apps.getIcareAccounts);
    app.post('/test/postIcare', verify.verifyToken, apps.RegisterIcare);
    // app.get('/app/getSchemeinfo/:scheme', verify.verifyToken, apps.getSchemeinfo);
    app.get('/test/getSchemeinfo/:scheme', apps.getSchemeinfo);
    app.get('/test/getMiniStatement/:scheme', verify.verifyToken, apps.getMemberinfo);
    app.post('/test/Statements', verify.verifyToken, apps.getStatement);
    app.post('/test/Statement', verify.verifyToken, apps.Statement);
    // Retrieve user Detail
    app.get('/test/profile', verify.verifyToken, apps.profile);
    
    // Payment
    app.post('/test/beneficiary', verify.verifyToken, apps.addBeneficiary);
    app.put('/test/member', verify.verifyToken, apps.updateMember);
    app.put('/test/autodebit', verify.verifyToken, apps.addBeneficiary);
    app.get('/test/getMemberbynumber', verify.verifyToken, apps.getMemberbyNumber);
    app.post('/test/payment', verify.verifyToken, apps.Deposit);
    // app.post('/test/update', verify.verifyToken, apps.Deposit);

}