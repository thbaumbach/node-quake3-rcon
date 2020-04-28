isFunction = (val) => {
    return (typeof val === 'function');
}

commonChecks = (val) => {
    if (typeof val != 'string') {
        throw 'type is not a string';
    }
    if (val.length < 1) {
        throw 'length smaller or equals zero';
    }
}

checkAddress = (val) => {
    try {
        commonChecks(val);
    } catch (e) {
        throw 'address ' + e;
    }
}

checkPassword = (val) => {
    try {
        commonChecks(val);
    } catch (e) {
        throw 'password ' + e;
    }
}

checkPositiveNumber = (val) => {
    const tmp = parseInt(val);
    if (isNaN(tmp)) {
        throw 'not a number';
    }
    if (tmp < 0) {
        throw 'number not positive';
    }
}

checkPort = (val) => {
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
checkTimeout = (val) => {
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
checkCommand = (val) => {
    try {
        commonChecks(val);
    } catch (e) {
        throw 'command ' + e;
    }
}

module.exports = {
    isFunction,
    commonChecks,
    checkAddress,
    checkPassword,
    checkPositiveNumber,
    checkPort,
    checkTimeout,
    checkCommand,
};
