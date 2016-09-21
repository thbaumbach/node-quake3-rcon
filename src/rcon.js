//
var udp = require('dgram');

/**
 * Create RCON Connection to a Quake3 Server
 * @param _DATA
 * @param {string} _DATA.address - server address
 * @param {string} _DATA.password - server password
 * @param {number|undefined} _DATA.port - server rcon port number [optional] [default: 27960]
 * @param {number|undefined} _DATA.timeout - socket listen timeout in milliseconds [optional] [default: 1500]
 * @param {boolean|undefined} _DATA.debug - dis/enable debug [optional] [default: false]
 * @returns {{send: send}}
 * @constructor
 */
var RCon = function (_DATA) {


    var DATA = _DATA;

    // set defaults when required
    DATA.port = DATA.port || 27960;
    DATA.timeout = DATA.timeout || 1500;
    DATA.debug = DATA.debug || false;

    /**
     * check if val is of type function
     * @param val
     * @returns {boolean}
     */
    function isFunction(val) {
        return (typeof val === 'function');
    }

    /**
     * check if type of val is string and size/length > 0
     * @param val
     */
    function commonChecks(val) {
        if (typeof val != 'string') {
            throw 'type is not a string';
        }
        if (val.length < 1) {
            throw 'length smaller or equals zero';
        }
    }

    /**
     * do checks on Address
     * @param val
     */
    function checkAddress(val) {
        try {
            commonChecks(val);
        } catch (e) {
            throw 'address ' + e;
        }
    }

    /**
     * do checks on password
     * @param val
     */
    function checkPassword(val) {
        try {
            commonChecks(val);
        } catch (e) {
            throw 'password ' + e;
        }
    }

    /**
     * commen checks for a positive number
     * @param val
     */
    function checkPositiveNumber(val) {
        var tmp = parseInt(val);
        if (isNaN(tmp)) {
            throw 'not a number';
        }
        if (tmp < 0) {
            throw 'number not positive';
        }
    }

    /**
     * do checks on port
     * @param val
     */
    function checkPort(val) {
        try {
            checkPositiveNumber(val);
        } catch (e) {
            throw 'port ' + e;
        }
    }

    /**
     * do checks on timeout
     * @param val
     */
    function checkTimeout(val) {
        try {
            checkPositiveNumber(val);
        } catch (e) {
            throw 'timeout ' + e;
        }
        if (val < 500) {
            throw 'timeout below 500 milliseconds';
        }
    }

    /**
     * do checks on command
     * @param val
     */
    function checkCommand(val) {
        try {
            commonChecks(val);
        } catch (e) {
            throw 'command ' + e;
        }
    }

    /**
     * Send command to Server
     * @param {string} _command - command string to send to server
     * @param {function|undefined} _onSendCallback [optional] - callback to process server response
     * @param {number|undefined} _timeoutMilliSecs [optional][default: 1500] - response timeout on udp socket in milliseconds
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
        } catch (e) {
            throw 'failed to create udp4 socket: ' + e;
        }

        checkCommand(command);
        checkTimeout(timeoutMilliSecs);

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
            throw 'failed to prepare send buffer: ' + e;
        }

        if (DATA.debug === true) {
            console.log('sending command "' + command + '"'
                + ' to address "' + DATA.address + '"'
                + ' on port "' + DATA.port + '"'
                + ' using password "' + DATA.password + '"'
                + ' Buffer("' + buffer.toString('ascii').slice(4, -1) + '")'
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
        function onMessage(message /*, rinfo */) {
            // stop timeout
            clearTimeout(timerId);
            // append message
            try {
                messageBuffer = messageBuffer + message.toString('ascii').slice(4).trim();
            } catch (e) {
                throw 'failed to append to messageBuffer: ' + e;
            }
            // start timeout
            timerId = setTimeout(function () {
                connection.close();
            }, timeoutMilliSecs);
        }

        /**
         * Returns accumulated "messageBuffer"
         * when the connection is closed
         */
        function onClose() {
            onSendCallback.call(null, messageBuffer);
        }

        /**
         * reporting DNS errors or for determining when it is
         * safe to reuse the buffer
         * @param {error} error
         */
        function onSend(error) {
            // close connection when no callback is available
            if (isFunction(onSendCallback)) {
                connection.close();
            }
            // TODO: handled/catch?
            if (error) {
                connection.close();
                throw error;
            }
        }

        // register callbacks
        if (isFunction(onSendCallback)) {
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

    // output init data
    if (DATA.debug === true) {
        console.log(DATA);
    }

    // external Interface
    return {
        send: send
    };
};

// export as module
module.exports = RCon;
