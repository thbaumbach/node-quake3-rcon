/*
 * quake3-rcon
 *
 * Copyright (c) 2016 Thomas Baumbach tom@xolo.pw
 *
 * Licensed under the MIT License
 */

var udp = require('dgram');

function RCon(server, password) {
    if (!password || password.length === 0)
        throw 'no password given';
    this.address = server.split(':')[0] || '127.0.0.1';
    this.port = parseInt(server.split(':')[1] || 27960);
    this.password = password;
};

RCon.prototype.send = function(command, callback) {
    var buffer = new Buffer(11 + this.password.length + command.length); // 4 + 5 + 1 + 1
    // fill the buffer
    buffer.writeUInt32LE(0xFFFFFFFF, 0); // magic code
    buffer.write('rcon ', 4);
    buffer.write(this.password, 9, this.password.length);
    buffer.write(' ', 9 + this.password.length, 1);
    buffer.write(command, 10 + this.password.length, command.length);
    buffer.write('\n', 10 + this.password.length + command.length, 1);
    //console.log('sending "' + command + '" to ' + this.address + ':' + this.port + ' using password "' + this.password + '" (' + buffer.toString('ascii').slice(4, -1) + ')');
    // setup the connection and send the message
    var connection = udp.createSocket('udp4');
    connection.send(buffer, 0, buffer.length, this.port, this.address, function(error) {
        if (!callback)
            connection.close(); // if there's no callback we can close the connection here        
        if (error)
            throw error;        
    });
    if (callback && typeof callback === 'function') {
        // if there's a callback we should handle the server's answer
        connection.on('message', function(message, rinfo) {
            callback.call(null, message, rinfo);
            connection.close();
        });
    }
};

module.exports = RCon;


