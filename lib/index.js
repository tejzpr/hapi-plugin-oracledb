'use strict';

const OracleDB = require('oracledb');
const Hoek = require('hoek');
const Death = require('death');


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

internals.detachConnection = (request, reply) => {
    if(request.app.db) {
        return request.app.db.release(function onRelease(err) {
            Hoek.assert(!err, err);
            request.app.db = null;
        });
    }
    else {
        if(typeof reply !== 'undefined') {
            return reply.continue();
        }
    }
};

internals.getConnection = (callback) => {

    Hoek.assert(internals.pool, 'No oracledb pool found');
    return internals.pool.getConnection(callback);
};

internals.stop = (server, next) => {
    return internals.pool.close(function(){
        server.log(['hapi-plugin-oracledb', 'database'], 'Connection to the database closed successfully');
        internals.pool = null;
        return next();
    });
};

exports.register = (server, baseOptions, next) => {
    Hoek.assert(baseOptions.hasOwnProperty('connectString'), 'Options must include connectionString property');
    Hoek.assert(baseOptions.hasOwnProperty('user'), 'Options must include user property');
    Hoek.assert(baseOptions.hasOwnProperty('password'), 'Options must include password property');
    server.log(['hapi-plugin-oracledb', 'database'], 'Connecting to database.... Please Wait.');
    const defaultOptions = {
        "poolMax": 10,
        "poolMin": 1,
        "poolIncrement": 5,
        "poolTimeout": 60,
        "poolPingInterval": 60
    };

    const options = Hoek.applyToDefaults(defaultOptions, baseOptions);

    return OracleDB.createPool(options).then(function(pool){
        internals.pool = pool;
        return internals.pool.getConnection((err, connection) => {

            Hoek.assert(!err, err);
            Hoek.assert(connection, 'Got no connection from pool');

            // release test connection
            connection.release();

            // add connection to request object
            server.ext('onPreAuth', function(request, reply){
                if(request.route.realm.pluginOptions.oracledb || request.route.settings.plugins.oracledb) {
                    return internals.attachConnection(request, reply);
                }
                return reply.continue();
            });

            // end connection after request finishes
            server.on('tail', function(request, reply){
                if(request.route.realm.pluginOptions.oracledb || request.route.settings.plugins.oracledb) {
                    return internals.detachConnection(request, reply);
                }
            });

            // try to close pool on server end
            server.ext('onPreStop', internals.stop);

            // add getDb() function to `server`
            server.decorate('server', 'getDb', internals.getConnection);

            server.log(['hapi-plugin-oracledb', 'database'], 'Connection to the database successfull');

            return next();
        });
    }).catch(function(err) {
        console.error("createPool() error: " + err.message);
    })

    // test connection

};

Death(function(signal, err) { //Hapi close connection in Windows
    if(internals.pool!=null)
    {
        return internals.pool.close(function(){
            console.log(['hapi-plugin-oracledb', 'database'], 'Connection to the database closed successfully');
            process.exit(0);
        });
    }
});

exports.register.attributes = {
    pkg: require('../package.json'),
    once: true
};
