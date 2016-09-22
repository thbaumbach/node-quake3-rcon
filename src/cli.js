try {
    if (process.argv.length < 4 || process.argv.length > 5)
        throw null;

    // initialize the RCon object
    var Q3RCon = require('./rcon');
    var CONFIG = {
        address: process.argv[2].toString(),
        password: process.argv[3].toString(),
        debug: true
    };
    if (process.argv.length === 5) {
        CONFIG.port = parseInt(process.argv[4]);
    }
    var rcon = new Q3RCon(CONFIG);

    // hook up stdin for the user input
    var stdin = process.openStdin();
    console.log('initialized. write your rcon commands here (send by pressing Enter):');
    stdin.addListener('data', function (data) {
        try {
            rcon.send(data.toString().trim(),
                /**
                 * message handler for server messages
                 * @param message
                 */
                function (message) {
                    console.log('server: ' + message);
                }
            );
        } catch (error) {
            console.log('error: ' + error);
        }
    });
} catch (error) {
    if (error)
        console.log('error:', error);
    console.log('usage: quake3-rcon <server-address> <rcon-password> [<server-port>]');
    process.exit(-1);
}
