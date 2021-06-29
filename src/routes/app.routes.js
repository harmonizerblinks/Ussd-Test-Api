module.exports = function(app) {

    var apps = require('../controllers/ppt/ppt.app.controller.js');
    var contact = require('../controllers/mail.controller.js');
    var ussd = require('../controllers/ussd.controller.js');
    const verify = require('../middleware/verifyJwtToken.middleware.js');
    const user = require('../middleware/verifysignup.middleware.js');

    // Register 
    app.post('/api/register', user.checkDuplicateUserNameOrEmail, verify.verifyToken, apps.createUser);

    // App user Login
    app.post('/api/login', apps.login);

    // Logout
    app.get('/api/logout', verify.verifyToken, apps.logout);

    // Change Password
    app.post('/api/set-pin', verify.verifyToken, apps.setPassword);
    
    // Change Password
    app.post('/api/change-pin', verify.verifyToken, apps.changePassword);

    // Retrieve user Detail
    app.get('/api/profile', verify.verifyToken, apps.profile);
    
    // Ussd Endpoint
    app.get('/api/ussd', ussd.ussdApp);

}