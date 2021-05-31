module.exports = function(app) {

    var ussd = require('../controllers/ussd.controller.js');
    var ahantaman = require('../controllers/ahantaman.ussd.controller.js');
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
    app.post('/', ahantaman.ussdApp);

    // Ussd 
    app.post('/api/ahantaman', ahantaman.ussdApp);
    app.post('/api/ppt', ppt.ussdApp);

    // // Retrieve all User
    // app.get('/api/users', verify.verifyToken, users.findAll);

    // // Retrieve all User
    // // app.get('/api/users/usertype/:type', verify.verifyToken, users.findAllByType);

    // // Retrieve Current Login User Prodile
    // // app.get('/api/profile', passport.authenticate('jwt', { session: false }), users.profile);

    // // Retrieve a single User by Id
    // app.get('/api/users/:userId', verify.verifyToken, users.findOne);

    // // Retrieve a single User by username
    // app.get('/api/users/username/:username', verify.verifyToken, users.findOneByUsername);

    // // Update a User with Id
    // app.put('/api/users/:userId', verify.verifyToken, verify.isAdmin, users.update);

    // // Delete a User with Id
    // app.delete('/api/users/:userId', verify.verifyToken, verify.isAdmin, users.delete);

}