const db = require("../src/db");
const path = require("path");

describe("Testing out the database class:", () => {
  test("Creating a database instance with the correct type", () => {
    const dbInstance = new db.DB("test", "./");
    expect(dbInstance.name).toBe("test");
    expect(dbInstance.path).toBe(process.cwd());
  });

  describe("Creating a database instance with the incorrect types", () => {
    describe("Parameter 'name' that is not a string should be thrown an error", () => {
      test("as a Number type", () => {
        expect(() => new db.DB(23, "./")).toThrow(db.ErrorList.invalidTypeName);
      });

      test("as an Object type", () => {
        expect(() => new db.DB({}, "./")).toThrow(db.ErrorList.invalidTypeName);
      });

      test("as an Array type", () => {
        expect(() => new db.DB([], "./")).toThrow(db.ErrorList.invalidTypeName);
      });
    });

    describe("Parameter 'path' that is not a string should throw an error", () => {
      test("as a Number type", () => {
        expect(() => new db.DB("test", 1924)).toThrow(db.ErrorList.invalidTypePath);
      });

      test("as an Object type", () => {
        expect(() => new db.DB("test", {})).toThrow(db.ErrorList.invalidTypePath);
      });

      test("as an Array type", () => {
        expect(() => new db.DB("test", [])).toThrow(db.ErrorList.invalidTypePath);
      });
    });
  })
})

describe("Testing out the basic database functions:", () => {
  describe("DB Instance create function", () => {
    test("It should accept parameter 'key' with String type correctly", () => {
      const dbInstance = new db.DB("test", "./");
      expect(dbInstance.create("name", "foo-dogsquared")).toBe("foo-dogsquared");
    });

    test("It should reject parameter 'key' with Number type", () => {
      const dbInstance = new db.DB("test", "./");
      expect(() => dbInstance.create(12345, "foo-dogsquared")).toThrow(db.ErrorList.invalidKey);
    });

    test("It should reject parameter 'key' with Array type", () => {
      const dbInstance = new db.DB("test", "./");
      expect(() => dbInstance.create([], "foo-dogsquared")).toThrow(db.ErrorList.invalidKey);
    });

    test("It should reject parameter 'key' with Object type", () => {
      const dbInstance = new db.DB("test", "./");
      expect(() => dbInstance.create({}, "foo-dogsquared")).toThrow(db.ErrorList.invalidKey);
    });
  });

  describe("DB Instance export function", () => {
    test("It should properly export the JSON file if directory exists", () => {
      const dbInstance = new db.DB("test", path.resolve(__dirname, "./output/"));

      for (let number = 0; number < 4; number++) {
        dbInstance.create(`testKey${number+1}`, `testValue${number+1}`);
      }

      expect(() => dbInstance.export()).not.toThrow();
    });

    test("It should properly throw an error if directory doesn't exists", () => {
      const dbInstance = new db.DB("test", "./directory-that-doesnt-exist");

      for (let number = 0; number < 4; number++) {
        dbInstance.create(`testKey${number+1}`, `testValue${number+1}`);
      }

      expect(() => dbInstance.export()).toThrow();
    });
  });

  describe("DB Instance clear file function", () => {
    test("It should properly clear the file if it exists", () => {
      const dbInstance = new db.DB("test", path.resolve(__dirname, "./output/"));
      expect(() => dbInstance.clear()).not.toThrow();
    });

    test("It should properly throw an error if the file doesn't exists", () => {
      const dbInstance = new db.DB("test", "./a-directory-that-doesn't-exist-most-likely-lol");
      expect(() => dbInstance.clear()).toThrow();
    });
  })
})
