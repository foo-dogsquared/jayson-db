
# Methods and properties
Each instance of jayson-db has the following methods and properties:

## Properties

Name | Type | Notes | Description
---  | --- | --- | --- |
`name` | `String` | (read-only) | The name of the database and the JSON file to be exported
`path` | `String` | (read-only) | The path of the JSON file to be exported (or imported)
`data` | `Object` | | The records that contain the database instance.
`schema` | `Object` | (read-only) | An instance of the [schema class](../src/schema.js). 

The `schema` property also contains the following properties and methods:

Name | Type | Notes | Description
--- | --- | --- | --- |
`validator` | `Object` | (read-only) | An [AJV](https://www.npmjs.com/package/ajv) instance.
`structure` | `Object` | (read-only) | The schema (in accordance to [JSON Schema spec](https://json-schema.org/)) itself.
`uniqueId` | `String` | (read-only) | The name of the primary key.
`data` | `Object` | | The data associated with the schema. This is linked together with the database instance so it's basically the records within the database.

## CRUD functions
### `create(key, value)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` | Simply the key to be found.
`value` | any | The value to be added with the key. 

Create a new key inside of the `dbObjects`. The key has the same restrictions as a JavaScript object, requiring to be a String (though it doesn't support the key being a [`Number`](https://developer.mozilla.org/en-US/docs/Glossary/Number), however). Returns the value from the newly created key in the database. 

### `read(key)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` | Key that is to be read

Returns the value from the specified key if found in the database object.

### `update(key, value)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` / `Function` | If it's a string, it's simply the key to be searched in the database. If it's a function, it needs to return a boolean, similar to how callbacks in [`Array.prototype.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) works except the parameter is only the record item.
`value` | any / `Function` | If the key is a string, you can assign anything to it (as long as it is a valid JSON value). You could also make the `value` a callback with the item that is found with the `key`. However, it is **required** for the `value` to be a function if the key is a function.

If you have a schema associated with the database, each updated item will be validated against the schema and only changes the record if it passes the validation process. 

Also, the return value will be different. If the key value is a function, the return value will be an object of the record that passed the filter with its old and updated value.

```js
const numbers = [2, 11, 1001, 10000001, 24, 235, 25];

/* 
* creating a database instance that is named as 'name',
* setting it in the current directory,
* no schema, and already putting data into the database with an array of numbers
*/
const db = new jaysonDB("name", "./", null, numbers);

function greaterThanTwenty(num) {
    return num > 20;
}

function plusTwenty(num) {
    return num + 20;
}

const updateResult = db.update(greaterThanTwenty, plusTwenty);

console.log(updateResult);
/* { 
/ '2': { old: 2002, updated: 2022 },
/ '3': { old: 20000002, updated: 20000022 },
/ '4': { old: 48, updated: 68 },
/ '5': { old: 470, updated: 490 },
/ '6': { old: 50, updated: 70 } 
/* }
```

### `delete(key)`
Simply deletes the key if found in the database. Returns the value of the deleted key.

There's also some methods available for each database instance:

## Other functions
### `export(prettify, includeSchema)`
Simply exports it into a JSON and sends it into the path as specified from the `dbFilePath`. By default, the JSON string is minified.

### `clear(deleteDB)`
Deletes the JSON file (but not the instance). You can also specify to just empty the JSON in the file system if you provided a falsy value (which is kinda pointless but eh... I implemented it just for the kicks). 

## Static methods
### `getDB(filePath[, dbSchemaPath])`
Simply returns the JSON file into a DB instance.
