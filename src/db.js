const fs = require('fs');
const os = require('os');
const path = require('path');

class DBError extends Error {
  constructor(statusCode, description = statusCode) {
    const errorDescription = `DB error: ${statusCode} ${description}`;
    super(errorDescription);
    this.statusCode = statusCode;
    this.description = errorDescription;
  }
}

const ErrorList = {
  invalidKey: new DBError(1, 'Invalid key'),
  keyAlreadyExists: new DBError(2, 'Key already exists'),
  keyNotFound: new DBError(3, 'Given key does not exist in the database'),
  invalidFile: new DBError(100, 'Database file is not valid'),
  invalidJson: new DBError(101, 'Invalid JSON from parsing'),
  invalidTypePath: new DBError(102, 'Invalid type of the path (it should be a string)')
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
  constructor(name, filePath = __dirname, data = {}) {
    this.name = name;

    if (typeof filePath !== 'string') throw ErrorList.invalidTypePath
    this.path = filePath;
    this.objects = data;
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
    if (!key) throw ErrorList.invalidKey;
    if (key in this.objects) throw ErrorList.keyAlreadyExists;
    this.objects[key] = value;
    return this.objects[key];
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
    if (!(key in this.objects)) throw ErrorList.keyNotFound;
    return this.objects[key];
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
    if (!(key in this.objects)) throw ErrorList.keyNotFound;
    this.objects[key] = value;
    return this.objects[key];
  }

  /*
  * Delete the key in the database
  * @param key {String} - the key to be deleted
  * @return the deleted value
  * 
  * @error code: 3 if the key didn't exist in the database
  */
  delete(key) {
    if (!(key in this.objects)) throw ErrorList.keyNotFound
    const deletedValue = this.objects[key];
    delete this.objects[key];
    return deletedValue;
  }

  // static methods of the database class
  export() {
    const dest = path.join(__dirname, this.path);
    const fullFilePath = `${dest + this.name}.json`;
    fs.writeFileSync(fullFilePath, JSON.stringify(this.objects), { encoding: 'utf8' });
  }

  clear() {
    const dest = path.join(__dirname, this.path);
    const fullFilePath = `${dest + this.name}.json`;
    fs.writeFileSync(fullFilePath, '', { encoding: 'utf8' })
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
  static getDB(filePath) {
    if (typeof filePath !== 'string') throw ErrorList.invalidTypePath;

    const dest = path.join(__dirname, filePath);
    const fileExtension = path.extname(dest);

    if (fileExtension.toLowerCase() !== ".json") throw ErrorList.invalidFile;

    // setting the database object now
    const rawJsonData = fs.readFileSync(dest, 'utf8');
    try {
      const databaseData = JSON.parse(rawJsonData);
      return new DB(filePath, path.basename(dest, '.json'), databaseData);
    } catch (error) {
      throw ErrorList.invalidJson;
    }
  }
}

module.exports = {
  DB,
  DBError,
  ErrorList
};
