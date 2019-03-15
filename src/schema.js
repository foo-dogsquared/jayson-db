const Ajv = require('ajv');

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
  filterFunctionType: new SchemaError(202, 'Filter callback is not a function'),
  duplicateKey: new SchemaError(203, 'Duplicate key'),
  keyNotFound: new SchemaError(204, 'Key not found'),
}

class Schema {
  constructor(object, uniqueId = null) {
    if (typeof object !== 'object') {
      throw SchemaErrorList.invalidType
    }
    
    // setting up read-only properties
    Object.defineProperty(this, "validator", {value: new Ajv(), enumerable: true});
    Object.defineProperty(this, "structure", {value: object, enumerable: true});
    Object.defineProperty(this, "uniqueId", {value: uniqueId, enumerable: true});
  }

  /*
  * Simply validates the data to be passed with the schema
  * @param data {Object}
  * @return {Boolean}
  */
  validate(data) {
    return this.validator.validate(this.structure, data);
  }
}

function isSchema(schemaObject) {
  return schemaObject && schemaObject instanceof Schema;
}

module.exports = {
  Schema,
  SchemaError,
  SchemaErrorList,
  isSchema,
};
