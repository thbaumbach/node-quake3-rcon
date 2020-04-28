//
var udp = require('dgram');

/**
 * Create RCON Connection to a Quake3 Server
 * @param _CONFIG
 * @param {string} _CONFIG.address - server address
 * @param {string} _CONFIG.password - server password
 * @param {number|undefined} _CONFIG.port - server rcon port number [optional] [default: 27960]
 * @param {number|undefined} _CONFIG.timeout - socket listen timeout in milliseconds [optional] [default: 1500]
 * @param {boolean|undefined} _CONFIG.debug - dis/enable debug [optional] [default: false]
 * @returns {{send: send}}
 * @constructor
 */
var RCon = function (_CONFIG) {


    var CONFIG = _CONFIG;

    // set defaults when required
    CONFIG.port = CONFIG.port || 27960;
    CONFIG.timeout = CONFIG.timeout || 1500;
    CONFIG.debug = CONFIG.debug || false;

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

        var connectTimeout, msgTimeout;
        var responseBuffer = '';
        var timeoutMilliSecs = _timeoutMilliSecs || CONFIG.timeout || 1500; // 1.5 secs
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
            buffer = new Buffer(11 + CONFIG.password.length + command.length); // 4 + 5 + 1 + 1
            // fill the buffer
            buffer.writeUInt32LE(0xFFFFFFFF, 0); // magic code
            buffer.write('rcon ', 4);
            buffer.write(CONFIG.password, 9, CONFIG.password.length);
            buffer.write(' ', 9 + CONFIG.password.length, 1);
            buffer.write(command, 10 + CONFIG.password.length, command.length);
            buffer.write('\n', 10 + CONFIG.password.length + command.length, 1);
        } catch (e) {
            throw 'failed to prepare send buffer: ' + e;
        }

        if (CONFIG.debug === true) {
            console.log('sending command "' + command + '"'
                + ' to address "' + CONFIG.address + '"'
                + ' on port "' + CONFIG.port + '"'
                + ' using password "' + CONFIG.password + '"'
                + ' Buffer("' + buffer.toString('ascii').slice(4, -1) + '")'
            );
        }

        /**
         * Event Callbacks
         */

        /**
         * Processes one incoming UDP Package from the Server
         * converts it to an ascii String and appends it to the "responseBuffer"
         * @param message
         */
        function onMessage(message /*, rinfo */) {
            // stop timeouts
            clearTimeout(connectTimeout);
            clearTimeout(msgTimeout);
            // append message
            try {
                responseBuffer += message.toString('ascii').slice(4).trim();
            } catch (e) {
                throw 'failed to append to responseBuffer: ' + e;
            }
            // start timeout
            msgTimeout = setTimeout(function () {
                connection.close();
            }, timeoutMilliSecs);
        }

        /**
         * Returns accumulated "responseBuffer"
         * when the connection is closed
         */
        function onClose() {
            onSendCallback.call(null, responseBuffer);
        }

        /**
         * reporting DNS errors or for determining when it is
         * safe to reuse the buffer
         * @param {error} error
         */
        function onSend(error) {
            // close connection when no callback is available
            if (!isFunction(onSendCallback)) {
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

        // setup check for timeout
        connectTimeout = setTimeout(function () {
            connection.close();
            throw new Error('connection.send TIMEOUT');
        }, timeoutMilliSecs);

        // and finally send the command
        connection.send(buffer, 0, buffer.length, CONFIG.port, CONFIG.address, onSend);
    };

    // check CONFIG
    checkAddress(CONFIG.address);
    checkPassword(CONFIG.password);
    checkPort(CONFIG.port);
    checkTimeout(CONFIG.timeout);

    // output init data
    if (CONFIG.debug === true) {
        console.log(CONFIG);
    }

    // external Interface
    return {
        send: send
    };
};

// export as module
module.exports = RCon;
