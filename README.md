> Hapi plugin for OracleDB


## What does it do
Attaches a OracleDB connection from a pool to every request.

## How does it do it
Via `request.app.db`. You can also manualy get a connection from the server via `server.getDb(function (err, connection) {})`.

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

server.route({ 
	method: 'GET', 
	path: '/', 
	handler: function (request, reply) { 
			request.app.db.query(...);
			return reply('ok'); 
		} 
	});
```

The options are the same options you can pass onto the `oracledb` lib for making a connection. See https://www.npmjs.com/package/oracledb for more info on the `oracledb` lib itself.

The keyword `db` is used because `connection` is used by `Hapi` and might cause confusion/collison.


