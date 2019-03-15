const events = require('events');
const fs = require("fs");
const path = require("path");
const schema = require("./schema");
const helpers = require('./helpers');

class DBError extends Error {
  constructor(statusCode, description = statusCode) {
    const errorDescription = `DB error: ${statusCode} ${description}`;
    super(errorDescription);
    this.statusCode = statusCode;
    this.description = errorDescription;
  }
}

/*
* There's two DB events so far:
* @create - emitted when a new value in the data object was added
* @delete - emitted when there is a key to be deleted
*/
class DBEvent extends events {}

const DBEventEmitter = new DBEvent();

const ErrorList = {
  invalidKey: new DBError(1, "Invalid key"),
  keyAlreadyExists: new DBError(2, "Key already exists"),
  keyNotFound: new DBError(3, "Given key does not exist in the database"),
  invalidSchema: new DBError(4, "Invalid schema is given"),
  schemaMismatch: new DBError(5, "New value doesn't match with the schema"),
  updateValueNeedFunction: new DBError(6, "Update value needs a function if the key value is a function"),
  invalidTypeName: new DBError(50, "Invalid type of the name (it should be a string)"),
  invalidFile: new DBError(100, "Database file is not valid"),
  invalidJson: new DBError(101, "Invalid JSON from parsing"),
  invalidTypePath: new DBError(102, "Invalid type of the path (it should be a string)"),
};

class DB {
  /* 
  * Represent a JSON DB object
  * @class DB
  * @constructor
  * @param name {String} - the name of the database (and the file to be exported)
  * @param filePath {String} - the location of the database file (or the export path if it doesn't exist yet)
  * @param data {Object} - the data to be associated with the database
  */
  constructor(name, filePath = null, schemaObject = null, databaseData = null, uniqueId = null) {
    this._data = {};
    Object.defineProperty(this, 'data', {
      get: function() { return this._data }
    })

    // checking if given name is a string
    if (typeof name !== "string") throw ErrorList.invalidTypeName;
    Object.defineProperty(this, 'name', {value: name, enumerable: true});

    // checking if file path is a string
    if (typeof filePath !== "string" && filePath !== null) throw ErrorList.invalidTypePath;
    Object.defineProperty(this, 'path', {value: path.resolve(filePath || "./"), enumerable: true});

    // setting the schema up, if there's any given
    if (schemaObject && typeof schemaObject === 'object') {
      Object.defineProperty(this, 'schema', {value: new schema.Schema(schemaObject, uniqueId), enumerable: true});
    }
    
    // filling the database with the given data, if there's any
    // we're also converting the data into an JavaScript object if the whole data is an array
    if (databaseData && databaseData instanceof Object) {
      let iterables = {};
      if (databaseData instanceof Array) Object.assign(iterables, databaseData);
      else iterables = databaseData;

      // if it does have a schema present, it would have a validation ready
      // since the 'create' function is already overtaken
      for (const record in iterables) this.create(iterables[record], record);
    }

    // setting up array-exclusive configurations if the given data is an array
    // here, the 'create' function will change the needed parameter
    if (databaseData instanceof Array) {
      Object.defineProperty(this, 'dbIsArray', {configurable: true, value: true, enumerable: true});
    }
  }

  // basic CRUD operation methods
  /* 
  * Create a new key inside of the data
  * @param key {String}
  * @param value {String}
  * @return the new key inside of the database
  * 
  * @error code: 1 if the key is invalid
  * @error code: 2 if the key is detected in the database
  */
  create(value, key = (this.dbIsArray) ? String(helpers.objLength(this._data)) : undefined) {
    if (!key || typeof key !== "string") throw ErrorList.invalidKey;
    if (key in this._data) throw ErrorList.keyAlreadyExists;
    
    if (this.schema && schema.isSchema(this.schema)) {
      if (!this.schema.validate(value)) throw ErrorList.schemaMismatch;
    }

    this._data[key] = value;

    DBEventEmitter.emit("create");
    return value;
  }

  /*
  * Read the specified key from the database
  * @param key {String}
  * @return the value from the key
  * 
  * @error code: 1 if the key is invalid
  * @error code: 3 if the key doesn't exist in the database
  */
  read(keyValue) {
    if (!keyValue) throw ErrorList.invalidKey;
    if (!(typeof keyValue === 'string' || typeof keyValue === 'function')) throw ErrorList.invalidKey;
    if (!(keyValue in this._data) && typeof keyValue === 'string') throw ErrorList.keyNotFound;

    // if it's a string, simply return the record item with the provided key
    if (typeof keyValue === 'string') {
      return this._data[keyValue];
    }
    
    // if the 'keyValue' is a function
    const filteredItems = {};
    for (const record in this._data) {
      const recordItem = this._data[record];
      const recordClone = helpers.clone(recordItem); 

      const passed = keyValue.call(this, recordClone);

      if (passed) {filteredItems[record] = this._data[record];}
    }

    return filteredItems;
  }

  /*
  * Update the value of the key within the database
  * @param key {String} - the string to be searched
  * @param value {any} - the new value of the key to be
  * @return the replaced value
  * 
  * @error code: 1 if the key is invalid
  * @error code: 3 if the key doesn't exist in the database
  * @error code: 5 if the updated value doesn't match in the schema (if any)
  * @error code: 6 if the 'keyValue' is a function but the 'updateValue' is not
  */
  update(keyValue, updateValue) {
    if (!keyValue) throw ErrorList.invalidKey;
    if (!(typeof keyValue === 'string' || typeof keyValue === 'function')) throw ErrorList.invalidKey;
    if (!(keyValue in this._data) && typeof keyValue === 'string') throw ErrorList.keyNotFound;

    // checking if the keyValue is a function
    // if the 'keyValue' is a function, map through them and filter it
    if (typeof keyValue === 'function') {
      // checking if the updateValue is a function, otherwise throw an error
      if (typeof updateValue === 'function') {
        const filteredItems = {};
        for (const record in this._data) {
          // creating a clone of the record just to avoid mutation inside of callback
          const recordItem = this._data[record];
          let recordClone = helpers.clone(recordItem);

          // executing the callback (that returns a boolean) on the record clone
          const passed = keyValue.call(this, recordClone);
  
          // if it passed, continue to push through and execute the update value callback function
          if (passed) {
            filteredItems[record] = {old: recordItem}
            recordClone = updateValue.call(this, recordClone);

            // checking against the schema (if any) and only mutate the object if it passes
            if (schema.isSchema(this.schema) && !this.schema.validate(recordClone)) continue;

            filteredItems[record]["updated"] = recordClone;
            this._data[record] = recordClone;
          }
        }

        DBEventEmitter.emit("update");
        return filteredItems;
      }
      else throw ErrorList.updateValueNeedFunction;
    }

    // this is for the case if the updateValue is simply a string
    // this is just for potential checking against the schema
    let itemClone = helpers.clone(this._data[keyValue]);

    // checking if the value is a function
    if (typeof updateValue === 'function') {
      itemClone = updateValue.call(this, itemClone);
    }
    else itemClone = updateValue;

    // checking if the database has a schema and validating against it
    if (schema.isSchema(this.schema)) {
      if (!this.schema.validate(itemClone)) throw ErrorList.schemaMismatch;
    }
    
    // mutate it
    this._data[keyValue] = itemClone;
    
    DBEventEmitter.emit("update");
    return itemClone;
  }

  /*
  * Delete the key in the database
  * @param key {String} - the key to be deleted
  * @return the deleted value
  * 
  * @error code: 3 if the key didn't exist in the database
  */
  delete(key) {
    if (!(key in this._data)) throw ErrorList.keyNotFound
    const deletedValue = this._data[key];
    delete this._data[key];
    DBEventEmitter.emit("delete");
    return deletedValue;
  }

  get fullFilePath() {
    return path.resolve(this.path, `${this.name}.json`);
  }

  get fullFileSchemaPath() {
    return path.resolve(this.path, `${this.name}.schema.json`);
  }

  // standard methods of the database instance
  export(prettify = false, includeSchema = true, asArray = (this.dbIsArray) ? true : false) {
    let data = this._data;
    // converting the database instance data as an array, if indicated
    if (asArray) {
      data = [];
      for (const recordEntry in this._data) {
        if (schema.isSchema(this.schema) && this.schema.uniqueId) {
          const recordObject = helpers.clone(this._data[recordEntry]);
          Object.defineProperty(recordObject, uniqueId, {value: recordEntry});
          data.push(recordObject);
        }
        else data.push(this._data[recordEntry]);
      }
    }

    // writing the resulting in the file
    if (Boolean(prettify)) fs.writeFileSync(this.fullFilePath, JSON.stringify(data, null, 4), { encoding: "utf8" });
    else fs.writeFileSync(this.fullFilePath, JSON.stringify(data), { encoding: "utf8" });

    // saving the schema as an associated JSON Schema file
    if (Boolean(includeSchema) && this.schema) fs.writeFileSync(this.fullFileSchemaPath, JSON.stringify(this.schema.structure, null, 4));
  }

  clear(deleteJSON = true) {
    if (Boolean(deleteJSON)) fs.unlinkSync(this.fullFilePath);
    else fs.writeFileSync(this.fullFilePath, "", { encoding: "utf8" })
  }

  /*
  * Get the specified database and make it into a database instance
  * @param filePath {String}
  * @return a new database instance from the specified JSON file
  * 
  * @error code: 100 if the database is not a JSON file
  * @error code: 101 if the JSON string from the file has gone through a parsing error
  * @error code: 102 if the given path is not a string
  */
  static getDB(filePath, fileDataSchemaPath = null) {
    if (typeof filePath !== "string") throw ErrorList.invalidTypePath;
    
    if (!filePath.endsWith(".json")) filePath += ".json";

    // resolving path for the main JSON file
    const dest = path.resolve(filePath);
    const dbName = path.basename(dest, ".json");
    const filePathExtension = path.extname(dest);

    if (filePathExtension.toLowerCase() !== ".json") throw ErrorList.invalidFile;

    // resolving path for the JSON schema file
    let jsonSchemaObject = null;
    // if there's no given schema path
    if (!fileDataSchemaPath) {
      const defaultSchemaPath = `${path.dirname(dest)}/${dbName}.schema.json`;
      try {
        const textBuffer = fs.readFileSync(defaultSchemaPath, "utf8");
        jsonSchemaObject = JSON.parse(textBuffer);
      }
      catch {
        jsonSchemaObject = null;
      }
    }
    // if there's the given schema path
    else {
      fs.accessSync(dest, fs.constants.F_OK | fs.constants.R_OK);
      const textBuffer = fs.readFileSync(fileDataSchemaPath, "utf8");
      jsonSchemaObject = JSON.parse(textBuffer);
    }
    
    // setting the database object now
    const rawJsonData = fs.readFileSync(dest, "utf8");
    const databaseData = JSON.parse(rawJsonData);
    return new DB(dbName, path.dirname(filePath), jsonSchemaObject, databaseData);
  }
}

module.exports = {
  DB,
  DBError,
  ErrorList
};
