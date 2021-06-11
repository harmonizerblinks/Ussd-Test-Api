module.exports = function(app) {

    var ussd = require('../controllers/ussd.controller.js');
    // Ahantaman
    var ahantaman = require('../controllers/ahantaman/ahantaman.ussd.controller.js');
    var ahantamantest = require('../controllers/ahantaman/ahantaman.test.ussd.controller.js');
    var ahantamantest = require('../controllers/ahantaman/ahantaman.officer.ussd.controller.js');
    // Aslan
    var aslan = require('../controllers/aslan/aslan.ussd.controller.js');
    // ECG 
    var ecg = require('../controllers/ecg.ussd.controller.js');

    var ppt = require('../controllers/ppt.ussd.controller.js');
    var gprtu = require('../controllers/gprtu.ussd.controller.js');
    var gprtuofficer = require('../controllers/gprtu.officer.ussd.controller.js');

    // *789*7879# 
    app.post('/group', gprtu.ussdApp);
    // *789*7880#
    app.post('/leader', gprtuofficer.ussdApp);
    // *789*7878#
    app.post('/', ahantamantest.ussdApp);

    // Ecg Ussd 
    app.post('/api/ecg', ecg.ussdApp);

    // Ahantaman collections 
    app.post('/api/ahantaman', ahantaman.ussdApp);
    app.post('/api/ahantaman/officer', ahantaman.ussdApp);

    // Aslan collections 
    app.post('/api/aslan', aslan.ussdApp);
    app.post('/api/aslan/officer', aslan.ussdApp);

    // SikaSoft Collection
    app.post('/api/sikasoft', ahantaman.ussdApp);
    app.post('/api/sikasoft/officer', ppt.ussdApp);
    
    // GPRTU Collection
    app.post('/api/gprtu', ahantaman.ussdApp);
    app.post('/api/gprtu/officer', ppt.ussdApp);

}