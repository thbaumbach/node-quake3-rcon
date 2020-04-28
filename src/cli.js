try {
    if (process.argv.length < 4 || process.argv.length > 5)
        throw null;

    // initialize the RCon object
    const Q3RCon = require('./rcon');
    const CONFIG = {
        address: process.argv[2].toString(),
        password: process.argv[3].toString()
    };
    if (process.argv.length === 5) {
        CONFIG.port = parseInt(process.argv[4]);
    }
    const rcon = new Q3RCon(CONFIG);

    // hook up stdin for the user input
    const stdin = process.openStdin();
    console.log('initialized. write your rcon commands here (send by pressing Enter):');
    stdin.addListener('data', (data) => {
        try {
            rcon.send(data.toString().trim(),
                /**
                 * message handler for server messages
                 * @param message
                 */
                (message) => {
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
