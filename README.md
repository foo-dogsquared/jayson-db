# json-database
An easy way to create a JSON database files.

## Features
- easily create a JavaScript object database with JSON files
- export the database instance back
- it's a NoSQL database... in a way, I think

## Getting started
The API is really just a [JavaScript class]() which means you start by creating an instance of it.

```js
new DB(dbName, [dbFilePath, dbObjects])
```

It needs mainly the name of the database but you can add the following data:
- `dbFilePath` &mdash; The valid path of the JSON file to be exported. It defaults to the current directory when no value was given.
- `dbObjects` &mdash; The data to be put inside of the database. It could be anything as long as it is an array or an object.

The instance has available methods too. The most basic functions is the CRUD (create, read, update, and read) capability.
- `DB.create(key, value)` &mdash; Create a new key inside of the `dbObjects`. The key has the same restrictions as a JavaScript object, requiring to be a String (though it doesn't support the key being a [`Number`](https://developer.mozilla.org/en-US/docs/Glossary/Number), however). Returns the value from the newly created key in the database. 
- `DB.read(key)` &mdash; Returns the value from the specified key if found in the database object.
- `DB.update(key, value)` &mdash; Updates the value with the specified key if found in the database. Also returns the specified value.
- `DB.delete(key)` &mdash; Simply deletes the key if found in the database. Returns the value of the deleted key.

There's also some methods available for each database instance:
- `DB.export()` &mdash; Simply exports it into a JSON and sends it into the path as specified from the `dbFilePath`.
- `DB.clear(deleteDB)` &mdash; Empties the JSON. You can also specify to delete the JSON in the file system if you provided a truthy value. 

There's also an easy method for setting a JSON database with this mini-library.
- `DB.getDB(filePath)` &mdash; Simply gets the JSON file into a DB instance.

## CLI program
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
