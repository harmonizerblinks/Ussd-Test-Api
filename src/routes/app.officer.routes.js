module.exports = function(app) {

    var apps = require('../controllers/app.controller.js');
    const verify = require('../middleware/verifyJwtToken.middleware.js');
    // const user = require('../middleware/verifysignup.middleware.js');

    app.post('/app/register', apps.Register);
    // App user Login
    app.post('/app/login', apps.login);
    // Logout
    app.get('/app/logout', verify.verifyToken, apps.logout);

    // Validate Officer Mobile With Merchant Code
    app.post('/app/validate/:merchant/:mobile', apps.validateOfficer);
    // Send Otp to Officer
    app.post('/app/send-otp', apps.sendOtp);
    // Verifiy Otp Input with Otp Sent to Officer
    app.post('/app/verify-otp', apps.verifyOtp);
    // Set officer Password
    app.post('/app/set-pin', apps.setPassword);
    // Change Officer Password
    app.post('/app/change-pin', verify.verifyToken, apps.changePassword);

    app.get('/app/getCustomers', apps.getMemberPersonal);
    // app.get('/app/getinfo/:mobile', apps.getinfo);
    app.get('/app/getOccupations', verify.verifyToken, apps.getOccupations);
    app.get('/app/getRegions', verify.verifyToken, apps.getRegions);
    app.get('/app/getIdType', verify.verifyToken, apps.getIdType);
    app.get('/app/getMemberinfo', verify.verifyToken, apps.getMemberinfo);
    app.get('/app/getScheme/:scheme', verify.verifyToken, apps.getScheme);
    app.get('/app/getIcareAccounts', verify.verifyToken, apps.getIcareAccounts);
    app.post('/app/postIcare', verify.verifyToken, apps.RegisterIcare);
    // app.get('/app/getSchemeinfo/:scheme', verify.verifyToken, apps.getSchemeinfo);
    app.get('/app/getSchemeinfo/:scheme', apps.getSchemeinfo);
    app.get('/app/getMiniStatement/:scheme', verify.verifyToken, apps.getMemberinfo);
    app.post('/app/Statements', verify.verifyToken, apps.getStatement);
    app.post('/app/Statement', verify.verifyToken, apps.Statement);
    // Retrieve user Detail
    app.get('/app/profile', verify.verifyToken, apps.profile);
    // Payment
    app.post('/app/beneficiary', verify.verifyToken, apps.addBeneficiary);
    app.put('/app/member', verify.verifyToken, apps.updateMember);
    app.put('/app/autodebit', verify.verifyToken, apps.stopAutoDebit);
    app.get('/app/getMemberbynumber', verify.verifyToken, apps.getMemberbyNumber);
    app.post('/app/payment', verify.verifyToken, apps.Deposit);

}