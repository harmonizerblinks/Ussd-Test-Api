module.exports = function(app) {

    var ussd = require('../controllers/ussd.controller.js');
    var creed = require('../controllers/creed.ussd.controller.js');

    // AfricaTalking
    var africatalking = require('../controllers/africatalking.ussd.controller.js');
    
    // Hubtel
    var hubtel = require('../controllers/hubtel.ussd.controller.js');

    // Emergent
    var emergent = require('../controllers/emergent.ussd.controller.js');

    // Arkesel
    var arkesel = require('../controllers/arkesel.ussd.controller.js');

    // Nalo
    var nalo = require('../controllers/nalo.ussd.controller.js');

    // Southpawsl
    var southpawsl = require('../controllers/southpawsl.ussd.controller.js');

    // Beem
    var beem = require('../controllers/beem.ussd.controller.js');

    
    // Personal Test
    app.post('/api/creed', creed.ussdApp);
    app.post('/api/ussd', ussd.ussdApp);

    // Africa Talking
    app.post('/api/africatalking', africatalking.ussdApp);

    // Hubtel USSD API 
    app.post('/api/hubtel', hubtel.ussdApp);

    // Emergent USSD API 
    app.post('/api/emergent', emergent.ussdApp);

    // South Pawsl USSD API 
    app.post('/api/southpawsl', southpawsl.ussdApp);

    // Arkesel USSD API 
    app.post('/api/arkesel', arkesel.ussdApp);

    // Nalo USSD API 
    app.post('/api/nalo', nalo.ussdApp);

    // Beem USSD API 
    app.post('/api/beem', beem.ussdApp);


}