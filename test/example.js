/*
 * minimal example 
 */

var Q3RCon = require('quake3-rcon');

var rcon = new Q3RCon({
    address: '127.0.0.1', 
    password: 'my_super_secret_password'
    /*port:  27960*/
});

rcon.send('say Hello, World!', function (message) {
    console.log(message);
});
