const path = require("path");
const schema = require("../src/schema");

describe("Testing out the Schema instance", () => {
  test("Creating a Schema instance", () => {
    const jsonSchema = {type: "number"};

    const schemaInstance = new schema.Schema(jsonSchema);

    expect(Object.is(schemaInstance.structure, jsonSchema)).toBe(true);
    expect(schemaInstance.uniqueId).toEqual(null);
  })
})
