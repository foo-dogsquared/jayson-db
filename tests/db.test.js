const path = require('path');
const db = require('../src/db');

// test input files
const jsonWithSchema = path.resolve(__dirname, "./json/number.json");
const jsonWithoutSchema = path.resolve(__dirname, "./json/withoutSchema.json");

// test input directory
const jsonDir = path.resolve(__dirname, "./json");

// test output directory
const outputDir = path.resolve(__dirname, "./json");
const nonExistentDir = path.resolve(__dirname, "./a-directory-that-doesn't-exist-most-likely-lol");

describe('Testing out the database class:', () => {
  test('Creating a database instance with the correct type', () => {
    const dbInstance = new db.DB('test');
    expect(dbInstance.name).toBe('test');
    expect(dbInstance.path).toBe(process.cwd());
  });

  describe('Creating a database instance with the incorrect types', () => {
    describe("Parameter 'name' that is not a string should be thrown an error", () => {
      test('as a Number type', () => {
        expect(() => new db.DB(23)).toThrow(db.ErrorList.invalidTypeName);
      });

      test('as an Object type', () => {
        expect(() => new db.DB({})).toThrow(db.ErrorList.invalidTypeName);
      });

      test('as an Array type', () => {
        expect(() => new db.DB([])).toThrow(db.ErrorList.invalidTypeName);
      });
    });

    describe("Parameter 'path' that is not a string should throw an error", () => {
      test('as a Number type', () => {
        expect(() => new db.DB('test', 1924)).toThrow(db.ErrorList.invalidTypePath);
      });

      test('as an Object type', () => {
        expect(() => new db.DB('test', {})).toThrow(db.ErrorList.invalidTypePath);
      });

      test('as an Array type', () => {
        expect(() => new db.DB('test', [])).toThrow(db.ErrorList.invalidTypePath);
      });
    });
  });
});

describe('DB Instance create function', () => {
  test("It should accept parameter 'key' with String type correctly", () => {
    const dbInstance = new db.DB('test');
    expect(dbInstance.create('foo-dogsquared', 'name')).toBe('foo-dogsquared');
  });

  test("It should reject parameter 'key' with Number type", () => {
    const dbInstance = new db.DB('test');
    expect(() => dbInstance.create('foo-dogsquared', 12345)).toThrow(db.ErrorList.invalidKey);
  });

  test("It should reject parameter 'key' with Array type", () => {
    const dbInstance = new db.DB('test');
    expect(() => dbInstance.create('foo-dogsquared', [])).toThrow(db.ErrorList.invalidKey);
  });

  test("It should reject parameter 'key' with Object type", () => {
    const dbInstance = new db.DB('test');
    expect(() => dbInstance.create('foo-dogsquared', {})).toThrow(db.ErrorList.invalidKey);
  });
});

describe("DB Instance read function", () => {
  test("It should accept a key that is a string", () => {
    const dbInstance = new db.DB('test');
    const key = "key";

    dbInstance.create(2345, key);

    expect(() => dbInstance.read(key)).not.toThrow();
  });

  test("It should return the key", () => {
    const dbInstance = new db.DB("test");
    const key = "key";

    dbInstance.create(2345, key);

    expect(dbInstance.read(key)).toEqual(2345);
  })
  
  test("It should accept a function that has one parameter", () => {
    function moreThan50(num) {return num > 50};
    const dbInstance = new db.DB('test');

    expect(() => dbInstance.read(moreThan50)).not.toThrow();
  });
  
  test("It should return an object of filtered records from the callback", () => {
    const numbers = Array.from({length: 100}, (value, index) => value = index);
    const dbInstance = new db.DB('test', null, null, numbers);

    function moreThan50(num) {return num > 50};

    expect(dbInstance.read(moreThan50)).toEqual(expect.any(Object));
  });
  
  test("It should accept a function that has more than one parameters (as long it doesn't use it)", () => {
    function moreThan50(num, ...extraParameter) {return num > 50};
    const dbInstance = new db.DB('test');

    expect(() => dbInstance.read(moreThan50)).not.toThrow();
  });

  test("It should return no filtered objects because of the extra parameter that is being used in the callback", () => {
    const numbers = Array.from({length: 100}, (value, index) => value = index);
    const dbInstance = new db.DB('test', null, null, numbers);

    function moreThan50(num, extraParameter) {return num > 50 && extraParameter};

    expect(dbInstance.read(moreThan50)).toEqual({});
  });
})

describe("DB instance update function", () => {
  test("It should accept a key which is a string", () => {
    const dbInstance = new db.DB("test");
    const key = "key";

    dbInstance.create(2345, key);

    expect(() => dbInstance.update(key, 255)).not.toThrow();
  })
  
  test("It should accept a value which can be anything that is valid JSON", () => {
    const dbInstance = new db.DB("test");
    const samples = {
      number: 2345,
      string: "string",
      array: [2, 3, 4, 5],
      object: {ok: true}
    }

    for (const sample in samples) {
      // giving all of the key in samples a fixed value
      dbInstance.create(3567, sample);

      expect(() => dbInstance.update(sample, samples[sample])).not.toThrow();
      expect(dbInstance.data[sample]).toEqual(samples[sample]);
    }
  })

  test("It should accept a value which is a function with one parameter", () => {
    const dbInstance = new db.DB("test");
    const key = "key";
    const value = 2345;
    function plus20(num) {return num + 20;}

    dbInstance.create(value, key);

    expect(() => dbInstance.update(key, plus20)).not.toThrow();
    expect(dbInstance.data[key]).toEqual(value + 20);
  })

  test("It should throw an error if the key is a callback and the value is a non-callback argument", () => {
    const dbInstance = new db.DB("test");
    const key = "key";
    function isEqualTo2345(num) { return num === 2345; }

    dbInstance.create(2345, key);

    expect(() => dbInstance.update(isEqualTo2345, 255)).toThrow();
  })
})

describe('DB Instance export function', () => {
  test('It should properly export the JSON file if directory exists', () => {
    const dbInstance = new db.DB('test', outputDir);

    for (let number = 0; number < 4; number++) {
      dbInstance.create(`testKey${number + 1}`, `testValue${number + 1}`);
    }

    expect(() => dbInstance.export()).not.toThrow();
  });

  test("It should properly throw an error if directory doesn't exists", () => {
    const dbInstance = new db.DB('test', './directory-that-doesnt-exist');

    for (let number = 0; number < 4; number += 1) {
      dbInstance.create(`testKey${number + 1}`, `testValue${number + 1}`);
    }

    expect(() => dbInstance.export()).toThrow();
  });
});

describe('DB Instance clear file function', () => {
  test('It should properly clear the file if it exists', () => {
    const dbInstance = new db.DB('test', outputDir);
    expect(() => dbInstance.clear()).not.toThrow();
  });

  test("It should properly throw an error if the file doesn't exists", () => {
    const dbInstance = new db.DB('test', nonExistentDir);
    expect(() => dbInstance.clear()).toThrow();
  });
});

describe('DB import function', () => {
  test('It should get a JSON file with a schema file and pass it as an instance of a database', () => {
    const testFile = jsonWithSchema;
    const importedFile = db.DB.getDB(testFile);

    expect(importedFile.name).toBe("number");
    expect(importedFile.path).toBe(path.resolve(process.cwd(), "./tests/json/"));
    expect(importedFile.data).toEqual(expect.anything());
    expect(importedFile.fullFileSchemaPath).toBe(path.resolve(jsonDir, `${importedFile.name}.schema.json`));
    expect(importedFile.fullFilePath).toBe(jsonWithSchema);
  });
});
