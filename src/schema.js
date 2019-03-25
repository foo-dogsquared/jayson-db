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
  invalidType: new TypeError('Invalid schema type (it should be a valid JSON)'),
  schemaMatchFailed: new SchemaError(201, 'Data is invalid according to the schema'),
  filterFunctionType: new SchemaError(202, 'Filter callback is not a function'),
  duplicateKey: new SchemaError(203, 'Duplicate key'),
  keyNotFound: new SchemaError(204, 'Key not found'),
}

class Schema {
  constructor(...schemaObjects) {
    if (typeof schemaObjects !== 'object') throw SchemaErrorList.invalidType
    if (!(schemaObjects instanceof Object)) throw SchemaErrorList.invalidType
    
    // setting up read-only properties
    Object.defineProperty(this, "ajv", {value: new Ajv({ schemas: schemaObjects}), enumerable: true});
    Object.defineProperty(this, "validator", {value: this.ajv.compile()})
    Object.defineProperty(this, "structure", {value: schemaObjects, enumerable: true});
  }

  /**
  * Simply validates the data to be passed with the schema
  * @param data {Object}
  * @return {Boolean}
  **/
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
