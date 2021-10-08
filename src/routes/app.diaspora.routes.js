module.exports = function(app) {

    var diaspora =  require('../controllers/ppt/ppt.diaspora.controller');
    // const verify = require('../middleware/verifyJwtToken.middleware');
    // const user = require('../middleware/verifysignup.middleware.js');

    // App user Login
    app.post('/ppt/diaspora/member-info', diaspora.postMemberInfo);
    app.post('/ppt/diaspora/create-member', diaspora.CreateMember);
    app.post('/ppt/diaspora/card-payment', diaspora.CardPayment);
   
}