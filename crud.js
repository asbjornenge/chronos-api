var pg = require('pg')
  , builder = require('mongo-sql');

const PG = {}


module.exports.get = async function get(client, table, criteria) {
//  where = typeof criteria === 'function' ? null : criteria
//  table = typeof table === 'string' ? table : null

  var query = builder.sql({
    type: 'select',
    table: table,
    where: criteria
  })

  return await client.query(query.toString(), query.values)
}

module.exports.post = async function (client, table, object) {
  var query = builder.sql({
    type: 'insert',
    table: table,
    values: object
  })
	return await client.query(query.toString() + ' RETURNING *', query.values)
}

var _update = PG.update = function (table, values, criteria, callback) {
  var args = Array.prototype.slice.call(arguments, 1);
  callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
  where = typeof criteria === 'function' ? {} : criteria;
  values = typeof values === 'function' ? {} : values;
  table = typeof table === 'string' ? table : null;

  var query = builder.sql({
      type: 'update',
      table: table,
      updates: values,
      where: where
    });

  return execute(query.toString(), query.values, callback);
};

var _delete = PG.delete = function (table,  criteria, callback) {
  var args = Array.prototype.slice.call(arguments, 1);
  callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
  where = typeof criteria === 'function' ? {} : criteria;
  table = typeof table === 'string' ? table : null;

  var query = builder.sql({
      type: 'delete',
      table: table,
      where: where
    });

  return execute(query.toString(), query.values, callback);
};

var execute = function (query, values, callback) {
  var args = Array.prototype.slice.call(arguments, 1);
	calback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
	query = typeof query === 'string' ? query : null;
	values = Array.isArray(values) ? values : [];

	if (!query)
		return call(callback, new Error('No query passed to execute.'));

  var client = new pg.Client(connectionString);
  client.connect(function(err) {
    // report errors to callback function.
    if (err)
      return call(callback, err);

		console.log(query, values);

    client.query(query, values, function(err, result) {
      client.end();
      return call(callback, err, result);
    })
  });
}

var connect = PG.connect = function (url, callback) {
  // Test the connection
  var client = new pg.Client(url);
  client.connect(function(err) {
    // report errors to callback function.
    if (err) {
      return call(callback, err);
    }

    // else initilize the pg-crud object.
    connectionString = url;
    client.end(); // close the connection once done.
    return call(callback);
  });
};

var call = function (callback, err, param1, param2, param3) {
  if (typeof callback === 'function')
    return callback(err, param1, param2, param3);
  
  if (err)
    throw err;
};
