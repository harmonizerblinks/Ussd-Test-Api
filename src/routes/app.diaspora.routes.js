module.exports = function(app) {

    var diaspora =  require('../controllers/ppt/ppt.diaspora.controller');
    // const verify = require('../middleware/verifyJwtToken.middleware');
    // const user = require('../middleware/verifysignup.middleware.js');

    // App user Login
    app.post('/ppt/diaspora/memberinfo', diaspora.postMemberInfo);
    app.post('/ppt/diaspora/createmember', diaspora.CreateMember);
    app.post('/ppt/diaspora/deposit/card', diaspora.CardPayment);
   
}