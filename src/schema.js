const Ajv = require('ajv');
const helpers = require('./helpers');

class SchemaError extends Error {
  constructor(statusCode, description = statusCode) {
    const errorMessage = `Schema error: ${statusCode} ${description}`;
    super(errorMessage);
    this.statusCode = statusCode;
    this.description = errorMessage;
  }
}

const SchemaErrorList = {
  invalidType: new SchemaError(200, 'Invalid schema type'),
  schemaMatchFailed: new SchemaError(201, 'Data is invalid according to the schema'),
  filterFunctionType: new SchemaError(202, 'Filter callback is not a function')
}

class Schema {
  constructor(object, uniqueIdentifiter = '_id') {
    if (typeof object !== 'object') {
      throw SchemaErrorList.invalidType
    }
    
    this.validator = new Ajv();
    this.schema = object;
    this.data = [];
  }

  /*
  * Simply validates the data to be passed with the schema
  * @param data {Object}
  * @return {Boolean}
  */
  validate(data) {
    return this.validator.validate(this.schema, data);
  }

  /*
  * Simply adds the data to be passed (but it will have to go through validation first)
  * @param data {Object}
  * @return void
  */
  add(data) {
    if (this.validator.validate(this.schema, data)) {
      this.data.push(data);
    }
    else throw {error: SchemaErrorList.schemaMatchFailed, data: data};
  }

  /*
  * Deletes the data that has gone through the filter
  * @param callback {Function} - it's the Array.filter callback
  * @return {Object} - the deleted data
  */
  delete(callback) {
    if (typeof callback !== 'function') throw SchemaErrorList.filterFunctionType
    const filteredData = this.data.filter(callback);
    for (const item of filteredData) {
      this.data.splice(this.data.indexOf(item.uniqueId), 1);
    };
    return filteredData;
  }

  /*
  * It's just a wrapper for the Array.filter function of the schema data
  * @param callback {Function}
  * @return {Object} - the data that is filtered
  */
  filter(callback) {
    if (typeof callback !== 'function') throw SchemaErrorList.filterFunctionType
    return this.data.filter(callback);
  }
}

module.exports = {
  Schema,
  SchemaError,
  SchemaErrorList,
};
