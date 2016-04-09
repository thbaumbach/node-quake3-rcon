
/*
 * minimal example for the quake3-rcon library
 */

var Q3RCon = require('quake3-rcon');

var rcon = new Q3RCon('127.0.0.1:27960', 'my_super_secret_password');

rcon.send('say Hello, World!', function(message) {
    console.log(message.toString('ascii').slice(4).trim());
});
