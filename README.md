# jayson-db
[![first-timers-only](https://img.shields.io/badge/first--timers--only-friendly-blue.svg?style=flat-square)](https://www.firsttimersonly.com/)

An easy way to create a JSON database files.

- [Features](#features)
- [Getting Started](#getting-started)
- [Methods and properties](#methods-and-properties)
- [Schema](#schema)
- [CLI program](#cli-program)

## Features
- It's a NoSQL database... in a way, I think
- Easily create a JavaScript object database with JSON files
- Export the database instance back
- Integrate a schema for your JSON database (with [JSON Schema](https://json-schema.org/understanding-json-schema/))

### What's it for?
- To easily create public APIs (at least for me, I would just publish them as a package or something)
- To make sure your data inside of the JSON files consistent
- Very small-scale and/or personally managed databases

### What's it *not* for?
- Asynchronous operations such as a web server
- Complex database structures and compositions
- Holding out very large data

If you're looking for a better alternative, you can use [SQLite](https://www.sqlite.org/) or [node-json-db](https://github.com/Belphemur/node-json-db).

## Getting started

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

Aaaaaand voila! You're good to go! You can also use the [CLI program](#cli-program) to quickly start using the module as well.

## jayson-db Class Interface

```js
new jaysonDB(dbName, options);
```

- `dbName` &mdash; It's simply the name of the database
- `options` &mdash; It's an object that configures your database a bit. Below are the properties that you can fill up:

Property | Type | Description
--- | --- | --- |
`path` | `String` | The valid path of the JSON file to be exported. It defaults to the current directory when no value (`null`) was given.
`schema` | `Object` | An object that describes the schema compliant to the [JSON Schema spec (Draft 7)](https://json-schema.org/understanding-json-schema/). You can visit the link to get a grasp on how to declare those or you could continue to the [JSON Schema section](./docs/json-schema.md) to get a very basic grasp before you continue to the link. Once you've set a schema for the `jayson-db` instance, data operations such as creating and updating will have additional operations for schema validation against the newly created/updated data. It will also have an additional validation process when exporting as well.
`data` | `Object` / `Array` | The data to be put inside of the database. It could be anything as long as it is an array or an object (in other words, a valid JSON object).
`isArray` | `Boolean` | Indicates the JSON will be an object or an array. Though, if the `data` property is present, this option is useless. This is only useful if you are starting with no data at all.

## [Methods and properties](./docs/api.md)
You can view the available methods and properties of the Jayson DB instance in this [documentation](./docs/api.md).

## [Schema](./docs/json-schema.md)
You could take a little exercise or a tutorial about JSON Schema right [over here](./docs/json-schema.md). Though, you can also go straight into the [official JSON Schema spec website](http://json-schema.org/) and learn about it. They provide a "Quickstart" section for those who are not truly familiar what's it about.

## CLI program
You could also use the module as a CLI program. To use it, simply refer to it by the name of the package (jayson-db).

If you install the package locally, you can call it by `npx <PACKAGE_NAME>` in the shell or from the `package.json`.

### `create`
There are a couple of commands to execute with. First, you could quickly create a database instance with `create` and supplying it with a name parameter (`jayson-db create <DATABASE_NAME>`). Then you'll be entered into a [Node REPL](https://nodejs.org/api/repl.html) (as if you entered `node` in the shell) with the database instance as `db`.

A couple of flags and option include:

- `-p` / `--path` &mdash; The export location of the JSON file. Defaults to current directory.
- `-s` / `--schema` &mdash; The import location of the schema file. Defaults to having no schema.

```sh
jayson-db (<DATABASE_NAME>): db
DB { name: '<DATABASE_NAME>', path: '/somewhere/in/the/fs', objects: {} }
# ...
jayson-db (<DATABASE_NAME>):
```

### `get`
You can also quickly get your already exported JSON files with the `get` command. All it needs is a location of the JSON file and `jayson-db` will create a `jayson-db` instance out of the JSON file. It'll also get the schema file (`<JSON_NAME>.schema.json`) automatically, if it detects one.

You can also explicitly tell the location of the schema file with the `-s` or `--schema` option.

Like the `create` command, if it success to create an instance. You enter into a Node REPL with the added context of the resulted instance as `db`.

```sh
$ jayson-db get ./<JSON_NAME>.json --schema ./path/to/schema.json
jayson-db (<JSON_NAME>): db
# the database instance object
```

### `repl`
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
