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

This time, it needs a location of the JSON file of the schema. By default, even if you didn't provide any, it will search for a JSON file named `<JSON_NAME>.schema.json` where `<JSON_NAME>` is the name of the JSON file you provided in the first parameter.

## Database properties with a schema

When a schema is set in the database, there will be a few changes with how it operates. Specifically, there will be a schema validation process against a record whenever the following process has occurred:

- creating a new record
- updating a record
- exporting of data to the JSON file

There will also be a change of return value when you export it to let you know which record has failed to be validated.

## Exercise of using a database with a schema

Let's take a very simple example and create a JSON file from scratch with `jayson-db`. Say that I want to have an array of positive numbers and only positive numbers in my JSON file. I recommend you to do this with the `repl` CLI command to easily set up and follow through the mini-tutorial.

We'll create a `jayson-db` instance but first, we'll create the schema since you can't change it after you created your `jayson-db` instance:

```js
const numberSchema = {type: 'number', minimum: 0};
```

Quite simple enough that we can understand what it stands for. The schema is a number and has a minimum value of 0, making it only exclusive for positive numbers to be saved in the database.

OK! Now we'll just set it with the database instance like so:

```js
const jaysonDBNumbers = new jaysonDB("numbers", {schema: numberSchema, isArray: true});
```

### Adding records into the database
Now, we're set! We can add anything but it'll reject that is not a number.

Let's try to create a record that is not a number into the database. The `dbInstance.create()` method needs a value and a key but with our instance being an array, we don't need to provide a key anymore.

```js
jaysonDBNumbers.create("this is not a number");
```

From it, you will encounter an error. If you're doing it with the `repl` command, you'll get even faster feedback. Immediately seeing the `DB error: 5 (New value does not match with the schema)` error message.

OK! Now let's try with a number less than 0.

```js
jaysonDBNumbers.create(-1);
```

You're still going to encounter an error saying that the value does not match with the schema. So far so good.

Let's try it with a boolean value.

```js
jaysonDBNumbers.create(true);
```

Still an error. How about arrays and objects?

```js
jaysonDBNumbers.create([2, 3, 4, 5]);
// error will be thrown

jaysonDBNumbers.create({two: 2, three: 3, four: 4, five: 5});
// yeah... no, it still doesn't accept it
```

OK! Let's try with a (supposedly) valid value this time.

```js
jaysonDBNumbers.create(1);
```

You should be able to see the value that you just added. Which means that the database instance is working at it should be. Now let's verify that by checking the records inside of the database instance with `jaysonDBInstance.data` and you should see the newly added data.

```js
console.log(jaysonDBNumbers.data)

// { '5241904643899587': 1 }
// Don't mind the randomly generated key with the added value. It does not matter much
// when the database instance is an array. Also, it's just there for ease of design purposes.
```

Now that we have our database instance working, let's add a few more data in our database instance for a short databse update exercise.

```js
for (let index = 0; index <= 500; index += 5) {
    jaysonDBNumbers.create(index);
}
```

### Updating the (array) database
Updating the records in the database is simple with `jaysonDbInstance.update()` method. You need a predicate function (or a function that returns a boolean value) for filtering the data that should pass through and a callback function that modifies the filtered records. You can visit the [methods and properties of `jayson-db`](./api.md) for more information on how to use it.

In this example, say that we want to double every even number. Let's create the functions for it.

```js
function isEven(num) {
    return num % 2 === 0;
}

function doubleNumber(num) {
    return num * 2;
}
```

Let's plug that in into the `update` method.

```js
const results = jaysonDBNumbers.update(isEven, doubleNumber);

console.log(results);
// { '2453896788147917': { old: 0, updated: 0 },
//   '3948544977985989': { old: 10, updated: 20 },
//    ...
//   '4614814703078575': { old: 490, updated: 980 } }
```

You should see a very large object describing the records that passed the filter and their old and updated values. Keep in mind about the schema validation process that happens after the callback has been executed. If the updated value does not match with the schema, it would not be updated. Thus, you would just see a record with only the `old` property.

```js
function makeItNaN(num) {
    return num + 'dogs';
}

const anotherResults = jaysonDBNumbers.update(isEven, makeItNaN);

console.log(anotherResults);
// { '2453896788147917': { old: 0 },
//   '3948544977985989': { old: 20 },
//   ...
//   '4614814703078575': { old: 980 } }
```

### Deleting the records in the database
Deleting the records is also simple with `jaysonDbInstance.delete()` method. All it needs is a predicate function and it will delete any record that passed through the predicate with a truthy boolean value.

Say that we want to delete every record divisible by 60. Let's create a predicate function for that.

```js
function divisibleBy60(num) {
    return num % 60 === 0;
}

// deleting it now with the `delete` method
const deletedRecords = jaysonDBNumbers.delete(divisbleBy60);

console.log(deletedRecords);
// { '2453896788147917': 0,
//   ...
//   '3161314733158199': 960 }
```

This time, it doesn't have a schema validation to take place.

### Exporting the database instance into a JSON file
Here's the core function of the module: to convert the database instance into a JSON file. Fortunately, it's quite easy with the [`jaysonDbInstance.export()`](./api.md) method.

You can just straight up invoke the function with no parameters and it'll have the JSON file for the database instance and the schema to be put out in the file system. From there, you should see two new files: a JSON file with the name of the database instance (in this case, `numbers` so it should be `numbers.json`) and a JSON schema file with the name of the database instance (`numbers.schema.json` in this case).

### Importing the database instance
When you want to modify it at another time (provided that your database instance is already saved), you can simply do so with `jaysonDB.getDB()`. It simply needs the path of the JSON file and the JSON schema file. If you don't provide the location for the schema file, it'll automatically search for the JSON schema file with the same name as your JSON file in the same directory (`<JSON_NAME>.schema.json`).

So that newly saved `numbers.json` and `numbers.schema.json`? You can easily get it by doing so (with a new script or a REPL session):

```js
const numbersDB = jaysonDB.getDB("numbers.json");
```

And you'll have your database instance already set with the schema.

## Conclusion
That concludes this tutorial on how to use a `jayson-db` instance with a schema. Hope you find this helpful. If you have any suggestions or want to contribute to the project (or both, why not), freely file an issue or a pull request for that matter. 
