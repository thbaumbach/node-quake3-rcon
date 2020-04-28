const udp = require('dgram');
const checks = require('./checks');

class RCon {
    
    constructor(_CONFIG) {
        this.CONFIG = _CONFIG;
        // set defaults when required
        this.CONFIG.port = this.CONFIG.port || 27960;
        this.CONFIG.timeout = this.CONFIG.timeout || 1500;
        this.CONFIG.debug = this.CONFIG.debug || false;

        // check this.CONFIG
        checks.checkAddress(this.CONFIG.address);
        checks.checkPassword(this.CONFIG.password);
        checks.checkPort(this.CONFIG.port);
        checks.checkTimeout(this.CONFIG.timeout);

        // output init data
        if (this.CONFIG.debug === true) {
            console.log(this.CONFIG);
        }
    }

    /**
     * Send command to Server
     * @param {string} _command - command string to send to server
     * @param {function|undefined} _onSendCallback [optional] - callback to process server response
     * @param {number|undefined} _timeoutMilliSecs [optional][default: 1500] - response timeout on udp socket in milliseconds
     */
    async send(_command, _onSendCallback, _timeoutMilliSecs) {

        const timeoutMilliSecs = _timeoutMilliSecs || this.CONFIG.timeout || 1500; // 1.5 secs
        const command = _command;
        const onSendCallback = _onSendCallback;
        let connectTimeout, msgTimeout;
        let responseBuffer = '';
        let connection = null;
        let buffer = null;

        try {
            connection = udp.createSocket('udp4');
        } catch (e) {
            throw 'failed to create udp4 socket: ' + e;
        }

        checks.checkCommand(command);
        checks.checkTimeout(timeoutMilliSecs);

        try {
            buffer = Buffer.alloc(11 + this.CONFIG.password.length + command.length); // 4 + 5 + 1 + 1
            // fill the buffer
            buffer.writeUInt32LE(0xFFFFFFFF, 0); // magic code
            buffer.write('rcon ', 4);
            buffer.write(this.CONFIG.password, 9, this.CONFIG.password.length);
            buffer.write(' ', 9 + this.CONFIG.password.length, 1);
            buffer.write(command, 10 + this.CONFIG.password.length, command.length);
            buffer.write('\n', 10 + this.CONFIG.password.length + command.length, 1);
        } catch (e) {
            throw 'failed to prepare send buffer: ' + e;
        }

        if (this.CONFIG.debug === true) {
            console.log('sending command "' + command + '"'
                + ' to address "' + this.CONFIG.address + '"'
                + ' on port "' + this.CONFIG.port + '"'
                + ' using password "' + this.CONFIG.password + '"'
                + ' Buffer("' + buffer.toString('ascii').slice(4, -1) + '")'
            );
        }

        return new Promise((resolve, reject) => {
            /**
             * Callbacks
             */

            const onMessage = (message /*, rinfo */) => {
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
                msgTimeout = setTimeout(() => {
                    connection.close();
                }, timeoutMilliSecs);
            }

            /**
             * Returns accumulated "responseBuffer"
             * when the connection is closed
             */
            const onClose = () => {
                onSendCallback.call(null, responseBuffer);
                resolve();
            }

            /**
             * reporting DNS errors or for determining when it is
             * safe to reuse the buffer
             * @param {error} error
             */
            const onSend = (error) => {
                // close connection when no callback is available
                if (!isFunction(onSendCallback)) {
                    connection.close();
                    resolve();
                }
                // TODO: handle/catch?
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
            connectTimeout = setTimeout(() => {
                connection.close();
                throw 'connection.send TIMEOUT';
            }, timeoutMilliSecs);

            // and finally send the command
            connection.send(buffer, 0, buffer.length, this.CONFIG.port, this.CONFIG.address, onSend);
        });        
    };
};

// export as module
module.exports = RCon;
