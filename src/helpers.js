const schema = require('./schema');

module.exports.generate = function(max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(Math.random() * max);
}

module.exports.isSchema = function(schemaObject) {
  return schemaObject && schemaObject instanceof schema.Schema;
}
