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

// this is mostly used for the functions detecting the type of parameter
// (in this case, it's either a string or a function)
module.exports.detectPredicateOrString = function(parameterType, data) {
  const status = {
    type: typeof parameterType,
    data: {}
  };

  if (typeof parameterType === 'string') {
    status.data[parameterType] = data[parameterType];
  }
  else if (typeof parameterType === 'function') {
    // if the 'parameterType' is a function
    for (const record in data) {
      const recordItem = data[record];
      const recordClone = this.clone(recordItem); 

      const passed = parameterType.call(this, recordClone);
  
      if (passed) {status.data[record] = data[record];}
    }
  }

  return status;
}
