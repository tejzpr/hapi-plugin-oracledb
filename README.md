> #Hapi plugin for OracleDB


## What does this plugin do?
Initialize a Oracle database connection pool and either attach a OracleDB connection to every request or enable the user to manually use connection from the server via `server.getDb(function (err, connection) {})`.

## How to use this plugin?
Initialize the plugin using same options you can pass onto the `oracledb` lib for making a connection. See https://www.npmjs.com/package/oracledb for more info on the `oracledb` lib itself.

***Initialize Plugin***
```javascript
server.register({
	register: require('hapi-plugin-oracledb'),
	options: {
		connectString: "localhost:1521/servicename",
		user: "root",
		password: "",
		log: true
	}
}, function (err) {
	if (err) console.log(err);
	...
});
```

## Enabling DB pool injection
 OracleDB pool injection into `request.app.db` object will be enabled only if routes or api realms which need the injection pass the following parameter during initialization.
 
 ***Route Injection***
 ```javascript
 server.route({ 
 	method: 'GET', 
 	config: {
         plugins:{
             oracledb: true
         }
     },
 	path: '/api/getName', 
 	handler: function (request, reply) { 
 			
 	} 
 });
 ```
 ***Plugin Realm Injection***
 ```javascript
 server.register(
     {
         register:require('./server/api/main'),
         options:{
             oracledb:true
         },
         routes: {
             prefix: '/api'
         }
     }, (err) =>
     {
         if (err) {
             console.error('Failed to load plugin:', err);
         }
     }
 );
 ```
## Manual Connection Initilization Using server.getDB()
 
Via `request.app.db`. You can also manualy get a connection from the server via `server.getDb(function (err, connection) {})`.
```javascript
server.route({ 
	method: 'GET', 
	config: {
        plugins:{
            'oracledb': true
        }
    },
	path: '/api/getName', 
	handler: function (request, reply) { 
			var query = 'select firstname,lastname from users';
			server.getDb(function(err,connection){
			   connection.execute(query,function (err,result) {
                reply(result);
              }); 
			});
		} 
	});
```
