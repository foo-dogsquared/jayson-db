const events = require('events');
const fs = require("fs");
const path = require("path");
const schema = require("./schema");
const helpers = require('./helpers');

class DBError extends Error {
  constructor(statusCode, description = statusCode) {
    const errorDescription = `DB error: ${statusCode} (${description})`;
    super(errorDescription);
    this.statusCode = statusCode;
    this.description = errorDescription;
  }
}

/**
* DB Events list:
* @create - emitted when a new value in the data object was added
* @delete - emitted when a deletion process has been completed
* @update - emitted when an updating process has been completed
**/
class DBEvent extends events {}

const DBEventEmitter = new DBEvent();

const ErrorList = {
  invalidKey: new DBError(1, "Invalid key"),
  keyAlreadyExists: new DBError(2, "Key already exists"),
  keyNotFound: new DBError(3, "Given key does not exist in the database"),
  invalidSchema: new DBError(4, "Invalid schema is given"),
  schemaMismatch: new DBError(5, "New value does not match with the schema"),
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
  constructor(name, options = { path: null, schema: null, data: null, isArray: false }) {
    Object.defineProperty(this, '_data', {value: {}, enumerable: false, configurable: true, writable: true});
    Object.defineProperty(this, 'data', {
      enumerable: true,
      configurable: false,
      get: function() { return this._data; }
    })

    // checking if given name is a string
    if (typeof name !== "string") throw ErrorList.invalidTypeName;
    Object.defineProperty(this, 'name', {value: name, enumerable: true});

    // checking if file path is a string
    const filePath = options.path;
    if (typeof filePath !== "string" && filePath !== null) throw ErrorList.invalidTypePath;
    Object.defineProperty(this, 'path', {value: path.resolve(filePath || "./"), enumerable: true});

    // setting the schema up, if there's any given
    const schemaObject = options.schema;
    if (schemaObject && typeof schemaObject === 'object') {
      Object.defineProperty(this, 'schema', {value: new schema.Schema(schemaObject), enumerable: true});
    }

    // filling the database with the given data, if there's any
    // we're also converting the data into an JavaScript object if the whole data is an array
    const databaseData = options.data;
    if (databaseData && databaseData instanceof Object) {
      let iterables = {};
      if (databaseData instanceof Array) Object.assign(iterables, databaseData);
      else iterables = databaseData;

      for (const record in iterables) this.create(iterables[record], record);
    }

    if (databaseData instanceof Array || options.isArray) {
      Object.defineProperty(this, 'isArray', {configurable: true, value: true, enumerable: true});
    }
  }

  // basic CRUD operation methods
  /** 
  * Create a new key inside of the data
  * @param key {String}
  * @param value {String}
  * @return the new key inside of the database
  * 
  * @error code: 1 if the key is invalid
  * @error code: 2 if the key is detected in the database
  **/
  create(value, key = (this.isArray) ? String(helpers.generate()) : undefined) {
    if (!key || typeof key !== "string") throw ErrorList.invalidKey;
    if (key in this._data) throw ErrorList.keyAlreadyExists;
    
    if (this.schema && schema.isSchema(this.schema)) {
      if (!this.schema.validate(value)) throw ErrorList.schemaMismatch;
    }

    this._data[key] = value;

    DBEventEmitter.emit("create");
    return value;
  }

  /**
  * Read the specified key from the database
  * @param key {String}
  * @return the value from the key
  * 
  * @error code: 1 if the key is invalid
  * @error code: 3 if the key doesn't exist in the database
  **/
  read(keyValue) {
    if (!keyValue) throw ErrorList.invalidKey;
    if (!(typeof keyValue === 'string' || typeof keyValue === 'function')) throw ErrorList.invalidKey;
    if (!(keyValue in this._data) && typeof keyValue === 'string') throw ErrorList.keyNotFound;

    const status = helpers.detectPredicateOrString(keyValue, this._data)

    return status.data;
  }

  /**
  * Update the value of the key within the database
  * @param key {String} - the string to be searched
  * @param value {any} - the new value of the key to be
  * @return the replaced value
  * 
  * @error code: 1 if the key is invalid
  * @error code: 3 if the key doesn't exist in the database
  * @error code: 5 if the updated value doesn't match in the schema (if any)
  * @error code: 6 if the 'keyValue' is a function but the 'updateValue' is not
  **/
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

  /**
  * Delete the key in the database
  * @param keyValue {String} - the key to be deleted
  * @return the deleted value
  * 
  * @error code: 3 if the key didn't exist in the database
  **/
  delete(keyValue) {
    if (!keyValue) throw ErrorList.invalidKey;
    if (!(typeof keyValue === 'string' || typeof keyValue === 'function')) throw ErrorList.invalidKey;
    if (!(keyValue in this._data) && typeof keyValue === 'string') throw ErrorList.keyNotFound
    
    const status = helpers.detectPredicateOrString(keyValue, this._data);

    // deleting the filtered data
    for (const filteredItems in status.data) {
      delete this._data[filteredItems];
    }
    
    DBEventEmitter.emit("delete");
    return status.data;
  }

  get fullFilePath() {
    return path.resolve(this.path, `${this.name}.json`);
  }

  get fullFileSchemaPath() {
    return path.resolve(this.path, `${this.name}.schema.json`);
  }

  // standard methods of the database instance
  export(prettify = true, includeSchema = true) {
    let data = this._data;
    // converting the database instance data as an array, if indicated
    if (this.isArray) {
      data = [];
      for (const recordEntry in this._data) {
        // if there's a schema and it doesn't validate against it, don't include it
        if (schema.isSchema(this.schema)) {
          if (!this.schema.validate(this._data[recordEntry])) continue;
        }
        
        data.push(this._data[recordEntry]);
      }
    }

    // writing the resulting in the file
    if (Boolean(prettify)) fs.writeFileSync(this.fullFilePath, JSON.stringify(data, null, 4), { encoding: "utf8" });
    else fs.writeFileSync(this.fullFilePath, JSON.stringify(data), { encoding: "utf8" });

    // saving the schema as an associated JSON Schema file
    if (Boolean(includeSchema) && this.schema) fs.writeFileSync(this.fullFileSchemaPath, JSON.stringify(this.schema.structure, null, 4));
  }

  clear() {
    const clonedData = helpers.clone(this._data);
    this._data = {};

    return clonedData;
  }

  /**
  * Get the specified database and make it into a database instance
  * @param filePath {String}
  * @return a new database instance from the specified JSON file
  * 
  * @error code: 100 if the database is not a JSON file
  * @error code: 101 if the JSON string from the file has gone through a parsing error
  * @error code: 102 if the given path is not a string
  **/
  static getDB(filePath, fileDataSchemaPath = null) {
    if (typeof filePath !== "string") throw ErrorList.invalidTypePath;
    
    const options = {
      path: path.dirname(filePath)
    };
    if (!filePath.endsWith(".json")) filePath += ".json";

    // resolving path for the main JSON file
    const dest = path.resolve(filePath);
    const dbName = path.basename(dest, ".json");
    const filePathExtension = path.extname(dest);

    if (filePathExtension.toLowerCase() !== ".json") throw ErrorList.invalidFile;

    // resolving path for the JSON schema file
    // if there's no given schema path
    if (!fileDataSchemaPath) {
      const defaultSchemaPath = `${path.dirname(dest)}/${dbName}.schema.json`;
      try {
        const textBuffer = fs.readFileSync(defaultSchemaPath, "utf8");
        options.schema = JSON.parse(textBuffer);
      }
      catch {
        options.schema = null;
      }
    }
    // if there's the given schema path
    else {
      fs.accessSync(dest, fs.constants.F_OK | fs.constants.R_OK);
      const textBuffer = fs.readFileSync(fileDataSchemaPath, "utf8");
      options.schema = JSON.parse(textBuffer);
    }
    
    // setting the database object now
    const rawJsonData = fs.readFileSync(dest, "utf8");
    options.data = JSON.parse(rawJsonData);
    return new DB(dbName, options);
  }
}

module.exports = {
  DB,
  DBError,
  ErrorList
};
