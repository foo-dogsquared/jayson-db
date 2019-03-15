# jayson-db
An easy way to create a JSON database files.

## Features
- it's a NoSQL database... in a way, I think
- easily create a JavaScript object database with JSON files
- export the database instance back
- integrate a schema for your JSON database (with [JSON Schema](https://json-schema.org/understanding-json-schema/))

### What's it for?
- To easily create public APIs (at least for me, I would just publish them as a package or something)
- To make sure your JSON has a bit of consistency
- Very small-scale and/or personally managed databases

### What's it *not* for?
- Asynchronous operations such as a web server
- Complex database structures and compositions
- 

If you're looking for a better alternative, you can use [SQLite]() or [node-json-db](https://github.com/Belphemur/node-json-db).

<h2 id="getting-started">Getting started</h3>
First, install it through [npm](http://npmjs.com/):

```sh
npm i jayson-db
```

Then just include it as a module to one of your JavaScript files:

```js
const jaysonDB = require("jayson-db");

// create an instance of the database
const dbName = "dogs";
const db = new jaysonDB(dbName);

db.create("breeds", ["chihuahua", "pug", "bullpit"]);
db.read("breeds");
db.update("breeds", function(value) {
    // update the 'breeds'
})

// or you can import from an existing JSON
const jsonLocation = "./cats.json";
const importedDB = jaysonDB.getDB(jsonLocation);
```

Aaaaaand voila! You're good to go!

<h2 id="jayson-db-interface">jayson-db Class Interface</h2>

```js
new jaysonDB(dbName[, dbFilePath[, dbSchema[, dbObjects[, dbPrimaryId]]]]);
```

It needs mainly the name of the database but you can add the following data:

- `dbFilePath` &mdash; The valid path of the JSON file to be exported. It defaults to the current directory when no value (`null`) was given.
- `dbSchema` &mdash; An object that describes the schema compliant to the [JSON Schema spec (Draft 7)](https://json-schema.org/understanding-json-schema/). You can visit the link to get a grasp on how to declare those or you could continue to the [JSON Schema section](#json-schema) to get a very basic grasp before you continue to the link.
- `dbObjects` &mdash; The data to be put inside of the database. It could be anything as long as it is an array or an object (in other words, a valid JSON object).
- `dbPrimaryId` &mdash; The name of the primary ID key to be attached in each of the record. By default, it doesn't have any.

<h2 id="methods-and-properties">Methods and properties</h3>

You can view the available methods and properties of the Jayson DB instance in this [documentation](./docs/api.md).

<h2 id="json-schema">JSON Schema</h2>
Usually in a database, you would expect to have some structure within your data. That's what schemas are mainly for.

You could integrate a schema for the database through the following methods:

<h3 id="db-class-constructor">DB Class Constructor</h3>

```js
const jaysonDB = require("jayson-db");

// ...
const name = "jayson-db-sample";
const path = "./";
const schema = {type: "number"};

const db = new jaysonDB(name, path, schema);
```

<h3 id="db-getdb-method"><code>DB.getDB()</code></h3>

```js
const jaysonDB = require("jayson-db");

// ...
const jsonLocation = "dogs.json";
const jsonSchemaLocation = "dogs.schema.json";
const db = jaysonDB.getDB("<JSON_LOCATION>", "<JSON_SCHEMA_LOCATION>");
```

This time, it needs a JSON file of the schema. When 

<h2 id="cli-program">CLI program</h2>
You could also use the module as a CLI program. To use it, simply refer to it by the name of the package (jayson-db).

If you install the package locally, you can call it by `npx <PACKAGE_NAME>` in the shell or from the `package.json`.

There are a couple of commands to execute with. First, you could quickly create a database instance with `create` and supplying it with a name parameter (`jayson-db create <DATABASE_NAME>`). Then you'll be entered into a [Node REPL](https://nodejs.org/api/repl.html) (as if you entered `node` in the shell) with the database instance as `db`.

```sh
jayson-db (<DATABASE_NAME>): db
DB { name: '<DATABASE_NAME>', path: '/somewhere/in/the/fs', objects: {} }
# ...
jayson-db (<DATABASE_NAME>):
```

You could also have a quick test of the library with the `repl` command which will make you enter into a REPL interface included with the DB class object as `DB`.

```sh
jayson-db REPL: DB
[Function: DB]
# ...
jayson-db REPL: const dbInstance = new DB(<DATABASE_NAME>, [PATH], [OBJECTS])
undefined
jayson-db REPL: dbInstance
DB { name: '<DATABASE_NAME>', path: '/whatever/man', objects: {} }
```
