const schema = require('./schema');

module.exports.generate = function(max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(Math.random() * max);
}

module.exports.objLength = function(object) {
  let length = 0;
  if (!object && typeof object !== 'object') return length;

  for (const property in object) {
    if (object.hasOwnProperty(property)) ++length;
  }

  return length;
}

module.exports.clone = function(data) {
  if (data instanceof Object) {
    return Object.assign({}, data);
  }
  else return data;
}
