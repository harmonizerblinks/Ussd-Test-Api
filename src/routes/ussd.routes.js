module.exports = function(app) {

    var ussd = require('../controllers/ussd.controller.js');
    var ahantaman = require('../controllers/ahantaman.ussd.controller.js');
    var ahantamantest = require('../controllers/ahantaman.test.ussd.controller.js');
    var ppt = require('../controllers/ppt.ussd.controller.js');
    var gprtu = require('../controllers/gprtu.ussd.controller.js');
    var gprtuofficer = require('../controllers/gprtu.officer.ussd.controller.js');
    // const verify = require('../middleware/verifyJwtToken.middleware.js');
    // const passport = require('passport');

    // *789*7879# 
    app.post('/group', gprtu.ussdApp);
    // *789*7880#
    app.post('/leader', gprtuofficer.ussdApp);
    // *789*7878#
    app.post('/', ahantamantest.ussdApp);

    // Ahantaman collections 
    app.post('/api/ahantaman', ahantaman.ussdApp);
    app.post('/api/ppt', ppt.ussdApp);

    // GPRTU Collection

}