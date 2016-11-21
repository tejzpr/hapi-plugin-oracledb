'use strict';

const OracleDB = require('oracledb');
const Hoek = require('hoek');

const internals = {
    pool: null
};

internals.attachConnection = (request, reply) => {

    return internals.getConnection((err, conn) => {

        Hoek.assert(!err, err);

        request.app.db = conn;

        return reply.continue();
    });
};

internals.getConnection = (callback) => {

    Hoek.assert(internals.pool, 'No oracledb pool found');

    return internals.pool.getConnection(callback);
};

internals.tail = (request) => {

    if (request.app.db) {
        request.app.db.release({
            retryCount: 10,
            retryInterval: 250
        });
    }
};

internals.stop = () => {

    return internals.pool.close(function(){
        console.log("Oracle connection pool closed..");
        internals.pool = null;
    });
};

exports.register = (server, baseOptions, next) => {

    Hoek.assert(baseOptions.hasOwnProperty('connectionString'), 'Options must include connectionString property');

    const defaultOptions = {
        "poolMax": 44,
        "poolMin": 1,
        "poolIncrement": 5,
        "poolTimeout": 4,
        "retryCount": 5,
        "retryInterval": 500,
        "runValidationSQL": true,
        "validationSQL": 'SELECT 1 FROM DUAL'
    };

    const options = Hoek.applyToDefaults(defaultOptions, baseOptions);

    internals.pool = OracleDB.createPool(options);

    // test connection
    return internals.pool.getConnection((err, connection) => {

        Hoek.assert(!err, err);
        Hoek.assert(connection, 'Got no connection from pool');

        // release test connection
        connection.release({
            retryCount: 10,
            retryInterval: 250
        });

        // add connection to request object
        server.ext('onPreAuth', internals.attachConnection);

        // end connection after request finishes
        server.on('tail', internals.tail);

        // try to close pool on server end
        server.on('stop', internals.stop);

        // add getDb() function to `server`
        server.decorate('server', 'getDb', internals.getConnection);

        server.log(['hapi-plugin-oracledb', 'database'], 'Connection to the database successfull');

        return next();
    });
};

exports.register.attributes = {
    pkg: require('../package.json'),
    once: true
};
