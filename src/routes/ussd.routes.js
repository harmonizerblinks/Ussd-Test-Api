module.exports = function(app) {

    var ussd = require('../controllers/ussd.controller.js');
    // Ahantaman
    var ahantaman = require('../controllers/ahantaman/ahantaman.ussd.controller.js');
    var ahantamantest = require('../controllers/ahantaman/ahantaman.test.ussd.controller.js');
    var ahantamanofficer = require('../controllers/ahantaman/ahantaman.officer.ussd.controller.js');
    
    // Leverage
    var leverage = require('../controllers/leverage/leverage.ussd.controller.js');
    var leveragetest = require('../controllers/leverage/leverage.test.ussd.controller.js');
    var leverageofficer = require('../controllers/leverage/leverage.officer.ussd.controller.js');
    
    // Sikasoft
    var sikkasoft = require('../controllers/sikkasoft/sikkasoft.ussd.controller.js');
    var sikkasofttest = require('../controllers/sikkasoft/sikkasoft.test.ussd.controller.js');
    var sikkasoftofficer = require('../controllers/sikkasoft/sikkasoft.officer.ussd.controller.js');
    
    // Hmplus
    var hmplus = require('../controllers/hmplus/hmplus.ussd.controller.js');
    var hmplustest = require('../controllers/hmplus/hmplus.test.ussd.controller.js');
    var hmplusofficer = require('../controllers/hmplus/hmplus.officer.ussd.controller.js');
    // Aslan
    var aslan = require('../controllers/aslan/aslan.ussd.controller.js');
    // Group Savings
    var aslan = require('../controllers/aslan/aslan.ussd.controller.js');
    // ECG 
    var ecg = require('../controllers/ecg.ussd.controller.js');
    var benin = require('../controllers/benin.controller.js');
    
    // Ppt
    var ppt = require('../controllers/ppt/ppt.ussd.controller.js');
    var ppticare = require('../controllers/ppt/ppt.icare.ussd.controller.js');
    var pptdmtca = require('../controllers/ppt/ppt.dmtca.ussd.controller.js');
    var pptofficer = require('../controllers/ppt/ppt.officer.ussd.controller.js');
    var pptpromo = require('../controllers/ppt/ppt.promo.controller.js');
    var ppttier2 = require('../controllers/ppt/ppt.tier2.ussd.controller.js');

    //PPT new
    var pptnew = require('../controllers/pptnew/ppt.ussd.controller.js');
    var pptnewtier2 = require('../controllers/pptnew/ppt.tier2.ussd.controller');
    var pptnewpromo = require('../controllers/pptnew/ppt.promo.controller');

    // School Billing
    var schoolbilling = require('../controllers/schoolbilling/schoolbilling.ussd.controller.js');

    // PayNow
    var paynowafrica = require('../controllers/paynow.controller.js');

    // Kamcu
    var kamcu = require('../controllers/kamcu/kamcu.officer.ussd.controller.js');

    // Baafo Pa Plus
    var baafopaplus = require('../controllers/baafopaplus/baafopaplus.ussd.controller');
    var baafopatest = require('../controllers/baafopaplus/baafopaplus.test.ussd.controller');

    // GPRTU
    var gprtu = require('../controllers/gprtu/gprtu.ussd.controller.js');
    var gprtuofficer = require('../controllers/gprtu/gprtu.officer.ussd.controller.js');

    var daakyeSusu = require('../controllers/airteltigo/daakye.ussd.controller.js');
    var chopboxonline = require('../controllers/chopboxonline/chopboxonline.controller.js');

    //VSLA
    var vsla_member = require('../controllers/vsla/vsla.member.ussd.controller');

    //School Insurance
    var schoolinsurance = require('../controllers/schoolinsurance/insurance.ussd.controller.js');
    var ptaSchoolinsurance = require('../controllers/schoolinsurance/pta.ussd.controller');

    // *789*7879# https://maximus-ussd-api.herokuapp.com/group
    app.post('/group', schoolinsurance.ussdApp);
    // *789*7880# https://maximus-ussd-api.herokuapp.com/leader
    app.post('/leader', ptaSchoolinsurance.ussdApp);
    // *789*7878# https://maximus-ussd-api.herokuapp.com/
    app.post('/', daakyeSusu.ussdApp);
    app.post('/benin', benin.ussdApp);

    // Ecg Ussd *
    app.post('/api/ecg', ecg.ussdApp);
    // Ahantaman collections 
    app.post('/api/ahantaman', ahantaman.ussdApp);
    app.post('/api/ahantaman/officer', ahantamanofficer.ussdApp);

    // Aslan collections 
    app.post('/api/aslan', aslan.ussdApp);
    app.post('/api/aslan/officer', aslan.ussdApp);

    // SikaSoft Collection
    app.post('/api/sikkasoft', sikkasoft.ussdApp);
    app.post('/api/sikkasoft/officer', sikkasoftofficer.ussdApp);
    
    // GPRTU Collection
    app.post('/api/gprtu', gprtu.ussdApp);
    app.post('/api/gprtu/officer', gprtuofficer.ussdApp);
    
    // LEVERAGE Collection
    app.post('/api/leverage', leverage.ussdApp);
    app.post('/api/leverage/officer', leverageofficer.ussdApp);

    // PPT Collection
    app.post('/api/ppt', ppt.ussdApp);
    app.post('/api/ppt/dmtca', pptdmtca.ussdApp);
    app.post('/api/ppt/officer', pptofficer.ussdApp);
    app.post('/api/ppt/icare', ppticare.ussdApp);
    app.post('/api/ppt/promo', pptpromo.ussdApp);
    app.post('/api/ppt/tier2', ppttier2.ussdApp);

    //PPTNew Collection
    app.post('/api/pptnew', pptnew.ussdApp);
    app.post('/api/pptnew/tier2', pptnewtier2.ussdApp);
    app.post('/api/pptnew/promo', pptnewpromo.ussdApp);

    // SCHOOL BILLING
    app.post('/api/schoolbilling', schoolbilling.ussdApp);

    // PAYNOWAFRICA
    app.post('/api/paynowafrica', paynowafrica.ussd);

    // KAMCU
    app.post('/api/kamcu', kamcu.ussdApp);
    
    // WESTOM INSURANCE
    // app.post('/api/baafopaplus', baafopatest.ussdApp);
    app.post('/api/baafopaplus', baafopaplus.ussdApp);
    // AIRTELTIGO
    app.post('/api/airteltigo', daakyeSusu.ussdApp);
    // CHOPBOXONLINE
    app.post('/api/chopboxonline', chopboxonline.ussdApp);

    //VSLA
    app.post('/api/vsla/member', vsla_member.ussdApp);

    //School Insurance
    app.post('/api/schoolinsurance', schoolinsurance.ussdApp);
    app.post('/api/schoolinsurance/pta', ptaSchoolinsurance.ussdApp);
}