
# JSON Schema
Usually in a database, you would expect to have some structure within your data. That's what schemas are mainly for. Take note that the schema was based on the [JSON Schema spec](http://json-schema.org/) and the validation and creation process with [ajv](https://www.npmjs.com/package/ajv) module.

You could integrate a schema for the database through the following methods:

## DB Class Constructor

```js
const jaysonDB = require("jayson-db");

// ...
const name = "jayson-db-sample";
const schema = {type: "number"};

// setting up a new Jayson DB instance named 'jayson-db-sample'
// to be exported on the current directory
// and associate a schema for the upcoming database records to be added
const db = new jaysonDB(name, {schema: schema});
```

## `jaysonDB.getDB()`
You could also import it as well with the `jaysonDB.getDB()` static method.

```js
const jaysonDB = require("jayson-db");

// if your JSON file has a schema file (<NAME>.schema.json) in the same directory,
// you don't really need to explicitly tell it but this one's just for demonstration purposes
const jsonLocation = "dogs.json";
const jsonSchemaLocation = "dogs.schema.json";
const db = jaysonDB.getDB(jsonLocation, jsonSchemaLocation);
```

This time, it needs a JSON file of the schema. 
