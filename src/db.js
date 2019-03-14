const events = require('events');
const fs = require("fs");
const os = require("os");
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
  schemaMismatch: new DBError(5, "There's a schema present. Use Schema.add() function instead or force it"),
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
  constructor(name, filePath = "./", schemaObject = null, databaseData = null) {
    // checking if given name is a string
    if (typeof name !== "string") throw ErrorList.invalidTypeName;
    this.name = name;

    // checking if file path is a string
    if (typeof filePath !== "string") throw ErrorList.invalidTypePath;
    this.path = path.resolve(filePath);

    // checking for the schema and the resulting data
    if (typeof schemaObject === 'object' && schemaObject !== null) {
        this.schema = new schema.Schema(schemaObject);
        this.data = this.schema.data;
        this.create = this.schema.add.bind(this.schema);
        this.delete = this.schema.delete.bind(this.schema);

        if (databaseData !== null && databaseData instanceof Array) {
          for (const record of databaseData) { this.create(record); }
        }
    }
    else if (databaseData !== null && typeof databaseData === 'object' && databaseData instanceof Object) {
      this.data = databaseData;
    }
    else this.data = {};
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
  create(key, value) {
    if (!key || typeof key !== "string") throw ErrorList.invalidKey;
    if (key in this.data) throw ErrorList.keyAlreadyExists;

    if (this.data instanceof Array) {
      const obj = {};
      obj[key] = value;
      this.data.push(obj);
    }
    else this.data[key] = value;

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
  read(key) {
    if (!key) throw ErrorList.invalidKey;
    if (!(key in this.data)) throw ErrorList.keyNotFound;
    
    if (helpers.isSchema(this.schema)) {
      return this.data.find(function(object) {
        return key === object[this.schema.uniqueId];
      }.bind(this))
    }
    else return this.data[key];
  }

  /*
  * Update the value of the key within the database
  * @param key {String} - the string to be searched
  * @param value {any} - the new value of the key to be
  * @return the replaced value
  * 
  * @error code: 1 if the key is invalid
  * @error code: 3 if the key doesn't exist in the database
  */
  update(key, value) {
    if (!key) throw ErrorList.invalidKey;
    if (!(key in this.data)) throw ErrorList.keyNotFound;
    this.data[key] = value;
    DBEventEmitter.emit("update");
    return this.data[key];
  }

  /*
  * Delete the key in the database
  * @param key {String} - the key to be deleted
  * @return the deleted value
  * 
  * @error code: 3 if the key didn't exist in the database
  */
  delete(key) {
    if (!(key in this.data)) throw ErrorList.keyNotFound
    const deletedValue = this.data[key];
    delete this.data[key];
    DBEventEmitter.emit("delete");
    return deletedValue;
  }

  get fullFilePath() {
    return path.resolve(this.path, `${this.name}.json`);
  }

  // standard methods of the database instance
  export(prettify = false) {
    if (Boolean(prettify)) fs.writeFileSync(this.fullFilePath, JSON.stringify(this.data, null, 4), { encoding: "utf8" });
    else fs.writeFileSync(this.fullFilePath, JSON.stringify(this.data), { encoding: "utf8" });
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
