
# Methods and properties
Each instance of jayson-db has the following methods and properties:

## Properties

Name | Type | Notes | Description
---  | --- | --- | --- |
`name` | `String` | (read-only) | The name of the database and the JSON file to be exported
`path` | `String` | (read-only) | The path of the JSON file to be exported (or imported)
`data` | `Object` | (read-only) | The records that contain the database instance.
`schema` | `Object` | (read-only) | An instance of the [schema class](../src/schema.js). 

The `schema` property also contains the following properties and methods:

Name | Type | Notes | Description
--- | --- | --- | --- |
`validator` | `Object` | (read-only) | An [AJV](https://www.npmjs.com/package/ajv) instance.
`structure` | `Object` | (read-only) | The schema (in accordance to [JSON Schema spec](https://json-schema.org/)) itself.
`uniqueId` | `String` | (read-only) | The name of the primary key.

## CRUD functions
### `create(value, key)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` | Simply the key to be found.
`value` | any | The value to be added with the key. 

Create a new key inside of the `dbObjects`. The key has the same restrictions as a JavaScript object, requiring to be a String (though it doesn't support the key being a [`Number`](https://developer.mozilla.org/en-US/docs/Glossary/Number), however). Returns the value from the newly created key in the database. 

If the database instance is an array (with the `db.isArray` set to `true`), you don't need to provide a key value as it is already generated for you (though a bit randomized) and it is also kinda pointless but you do you.

### `read(key)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` / `Function` | If it's a string, it is simply the string to be found on the database. If it's a function, it needs to be a predicate (a function returning a boolean value).

Returns the value from the specified key if found in the database object. If it's a function, it will return an object that passed through the predicate.

-----
AUTHOR'S NOTE:
**If the database instance is an array, I recommend to make the key as a callback instead. The generated key values when it comes to array is randomized.**

### `update(key, value)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` / `Function` | If it's a string, it's simply the key to be searched in the database. If it's a function, it needs to return a boolean, similar to how callbacks in [`Array.prototype.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) works except the parameter is only the record item.
`value` | any / `Function` | If the key is a string, you can assign anything to it (as long as it is a valid JSON value). You could also make the `value` a predicate callback with the item that is found with the `key`. However, it is **required** for the `value` to be a function if the key is a function.

If you have a schema associated with the database, each updated item will be validated against the schema and only changes the record if it passes the validation process. 

Also, the return value will be different. If the key value is a function, the return value will be an object of the record that passed the filter with its old and updated value.

```js
const numbers = [2, 11, 1001, 10000001, 24, 235, 25];

/* 
* creating a database instance that is named as 'name',
* setting it in the current directory,
* no schema, and already putting data into the database with an array of numbers
*/
const db = new jaysonDB("name", {data: numbers});

function greaterThanTwenty(num) {
    return num > 20;
}

function plusTwenty(num) {
    return num + 20;
}

const updateResult = db.update(greaterThanTwenty, plusTwenty);

console.log(updateResult);
/* { 
/ '2': { old: 1001, updated: 1021 },
/ '3': { old: 10000001, updated: 10000021 },
/ '4': { old: 24, updated: 44 },
/ '5': { old: 235, updated: 255 },
/ '6': { old: 25, updated: 45 } 
/* }
```

### `delete(key)`

Parameter | Type | Description
--- | --- | --- |
`key` | `String` / `Function` | If it's a string, it simply finds within the database with the key and deletes it. If it's a callback, you have to make sure it is a predicate function. Any item that passes through the predicate will be deleted.

Also, it returns an object with the deleted records.

-----
AUTHOR'S NOTE:
**If the database instance is an array, I recommend to make the key as a predicate function instead. Same reason as recommending a callback with the `read` function as you can't make an accurate result from the very randomized assigned key values.**

## Other functions

### `export(prettify, includeSchema)`

Parameter | Type | Description
--- | --- | --- |
`prettify` | `Boolean` | If given a truthy value, it will pretty print and export the JSON, making it more human-readable. Otherwise, it will export the JSON minified. It is set to `true` by default.
`includeSchema` | `Boolean` | Specifies whether the schema should be saved along with the data. By default, it is set to `true` and it will be saved as `<DATABASE_NAME>.schema.json` in the same directory as indicated by `<DATABASE_PATH>` (`DBInstance.path`).

Its return value will be different depending whether you have set a schema or not. If you have no schema set to your database, it is a void function.

If you have a schema associated with the database, each record will have to be validated first before being added into the resulting JSON file. Furthermore, the return value will be an object of records that didn't passed the schema validation.

### `clear()`
Simply clears the database instance. Also returns the entire database before the deletion happens.

## Static methods
### `getDB(filePath[, dbSchemaPath])`

Parameter | Type | Description
--- | --- | --- |
`filePath` | `String` | The path of the JSON file to be imported
`dbSchemaPath` | `String` | The path of the JSON schema file to be associated with the upcoming Jayson DB instance. By default, it finds the JSON schema file with the name of the JSON file from `filePath` (`<NAME_OF_JSON>.schema.json`) in the same directory.

Simply returns the JSON file into a Jayson DB instance.
