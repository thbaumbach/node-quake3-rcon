//
var udp = require('dgram');

/**
 * Create RCON Connection to a Quake3 Server
 * @param _DATA
 * @param {string} _DATA.address - server address
 * @param {string} _DATA.password - server password
 * @param {number} _DATA.port - server rcon port number [optional] [default: 27960]
 * @param {number} _DATA.timeout - socket listen timeout in milliseconds [optional] [default: 1500]
 * @param {boolean} _DATA.debug - dis/enable debug [optional] [default: false]
 * @returns {{send: send}}
 * @constructor
 */
var RCon = function (_DATA) {


    var DATA = _DATA;

    // set defaults when required
    DATA.port = DATA.port || 27960;
    DATA.timeout = DATA.timeout || 1500;

    /**
     * check if type of val is string and size/length > 0
     * @param val
     */
    var commonChecks = function (val) {
        if (typeof val !== 'string') {
            throw 'type is not string';
        }
        if (val.length < 1) {
            throw 'length smaller or equals zero';
        }
    };

    /**
     * do checks on Address
     * @param val
     */
    var checkAddress = function (val) {
        try {
            commonChecks(val);
        } catch (e) {
            throw e.message + ' for address';
        }
    };

    /**
     * do checks on password
     * @param val
     */
    var checkPassword = function (val) {
        try {
            commonChecks(val);
        } catch (e) {
            throw e.message + ' for password';
        }
    };

    /**
     * commen checks for a positiv number
     * @param val
     */
    var checkPositivNumber = function (val) {
        var tmp = parseInt(val);
        if (isNaN(tmp)) {
            throw 'port is not a number ';
        }
        if (tmp < 0) {
            throw 'port can not be negative';
        }
    };

    /**
     * do checks on port
     * @param val
     */
    var checkPort = function (val) {
        try {
            checkPositivNumber(val);
        } catch (e) {
            throw e.message + ' for port';
        }
    };

    /**
     * do checks on timeout
     * @param val
     */
    var checkTimeout = function (val) {
        try {
            checkPositivNumber(val);
        } catch (e) {
            throw e.message + ' for timeout';
        }
        if (val < 500) {
            throw 'timeout bellow 500 milliseconds not allowed';
        }
    };

    /**
     * do checks on command
     * @param val
     */
    var checkCommand = function (val) {
        try {
            commonChecks(val);
        } catch (e) {
            throw e.message + ' for command';
        }
    };

    /**
     * Send command to Server
     * @param {string} _command - command string to send to server
     * @param {function} _onSendCallback [optional] - callback to process server response
     * @param {number} _timeoutMilliSecs [optional][default: 1500] - response timeout on udp socket in milliseconds
     */
    var send = function (_command, _onSendCallback, _timeoutMilliSecs) {

        var timerId;
        var messageBuffer = '';
        var timeoutMilliSecs = _timeoutMilliSecs || DATA.timeout || 1500; // 1.5 secs
        var command = _command;
        var onSendCallback = _onSendCallback;
        var connection;
        var buffer;

        try {
            connection = udp.createSocket('udp4');
        } catch (err) {
            throw 'failed to create udp4 socket';
        }

        checkCommand(command);

        try {
            buffer = new Buffer(11 + DATA.password.length + command.length); // 4 + 5 + 1 + 1
            // fill the buffer
            buffer.writeUInt32LE(0xFFFFFFFF, 0); // magic code
            buffer.write('rcon ', 4);
            buffer.write(DATA.password, 9, DATA.password.length);
            buffer.write(' ', 9 + DATA.password.length, 1);
            buffer.write(command, 10 + DATA.password.length, command.length);
            buffer.write('\n', 10 + DATA.password.length + command.length, 1);
        } catch (e) {
            throw 'failed to prepare send buffer';
        }

        if (DATA.debug === true) {
            console.debug(DATA);
            console.debug('sending command "' + command + '"'
                + ' to address "' + DATA.address + '"'
                + ' on port "' + DATA.port + '"'
                + ' using password "' + DATA.password + '"'
                + ' Buffer(' + buffer.toString('ascii').slice(4, -1) + ')'
            );
        }


        /**
         * Event Callbacks
         */

        /**
         * Processes one incoming UDP Package from the Server
         * converts it to an ascii String and appends it to the "messageBuffer"
         * @param message
         */
        var onMessage = function (message /*, rinfo */) {
            // stop timeout
            clearTimeout(timerId);
            // append message
            try {
                messageBuffer = messageBuffer + message.toString('ascii').slice(4).trim();
            } catch (e) {
                throw 'failed to append to messageBuffer';
            }
            // start timeout
            timerId = setTimeout(function () {
                connection.close();
            }, timeoutMilliSecs);
        };

        /**
         * Returns accumulated "messageBuffer"
         * when the connection is closed
         */
        var onClose = function () {
            if (typeof onSendCallback === 'function') {
                onSendCallback.call(null, messageBuffer);
            }
        };

        /**
         * reporting DNS errors or for determining when it is
         * safe to reuse the buffer
         * @param {error} e
         */
        var onSend = function (e) {
            // close connection when no callback is available
            if (typeof onSendCallback !== 'function') {
                connection.close();
            }
            // TODO: handled/caught?
            if (e) {
                throw e;
            }
        };

        // register callbacks
        if (typeof onSendCallback === 'function') {
            connection.on('message', onMessage);
            connection.on('close', onClose);
        }
        // and finally send the command
        connection.send(buffer, 0, buffer.length, DATA.port, DATA.address, onSend);
    };

    //

    // check DATA
    checkAddress(DATA.address);
    checkPassword(DATA.password);
    checkPort(DATA.port);
    checkTimeout(DATA.timeout);

    // external Interface
    return {
        send: send
    };
};

// export as module
module.exports = RCon;


