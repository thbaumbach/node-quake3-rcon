/*
 * quake3-rcon
 *
 * Copyright (c) 2016 Thomas Baumbach tom@xolo.pw
 *
 * Licensed under the MIT License
 */

var Q3RCon = require('./rcon');
var rcon = null;

// initialize the RCon object
try {
    rcon = new Q3RCon(process.argv[2], process.argv[3]);
} catch(error) {
    console.log('usage: quake3-rcon <server-address[:port]> <rcon-password>');
    process.exit(-1);
}

// message handler for server messages
function handleMessages(message) {
    console.log('server: ' + message.toString('ascii').slice(4).trim());
};

// hooking up the stdin for the user commands
var stdin = process.openStdin();

console.log('initialized. write your rcon commands here (send by pressing Enter):');
stdin.addListener("data", function(data) {
    try {
        rcon.send(data.toString().trim(), handleMessages);        
    } catch(error) {
        console.log('error: ' + error);
    }
});
