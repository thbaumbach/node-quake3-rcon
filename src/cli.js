try {
    // initialize the RCon object
    var Q3RCon = require('./rcon');
    var DATA = {
        address: process.argv[2].toString(),
        password: process.argv[3].toString()
    };
    if (process.argv.length > 2) {
        DATA.port = parseInt(process.argv[4]);
    }
    var rcon = new Q3RCon(DATA);

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
                //, timeoutSecs
            );
        } catch (error) {
            console.log('error: ' + error);
        }
    });
} catch (error) {
    console.log('usage: quake3-rcon <server-address> <rcon-password> [<server-port>]', error ? '(' + error + ')' : '');
    process.exit(-1);
}
