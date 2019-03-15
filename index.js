#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const repl = require('repl');

const program = require('commander');
const jaysonDB = require('./src');

const programName = 'jayson-db';

// CLI tool program
program
  .version('0.1.0', '-v, --version');

// 'create' function of the CLI tool
program
  .command('create <name>')
  .description('Create an instance of the database and enter to a Node REPL with the database instance')
  .option('-p, --path [filePath]', 'The output path of the JSON to be exported', './')
  .option('-s, --schema [filePath]', 'The schema of each record in the database according to the JSON Schema spec (https://json-schema.org/specification.html)', null)
  .action((name, options) => {
    const schemaPath = options.schema;
    let schemaObject;
    if (schemaPath) {
      const resolvedPath = path.resolve(schemaPath);
      const fileBuffer = fs.readFileSync(resolvedPath, { encoding: 'utf8' });
      schemaObject = JSON.parse(fileBuffer);
    } else schemaObject = null;

    // Creating the database instance
    const dbInstance = new jaysonDB.DB.DB(name, options.path, schemaObject);

    // Starting the REPL server
    const replServer = repl.start({
      prompt: `${programName} (${name}): `,
    });

    replServer.context.db = dbInstance;
  });

program
  .command('get <filePath>')
  .description('Get the JSON file in the specified path and create it as a DB instance')
  .option('-s, --schema', 'The location of the schema file to be validated against', null)
  .action((filePath, options) => {
    const resolvedPath = path.resolve(filePath);
    let schemaObject = null;
    if (options.schema && !options.disableSchema) {
      const schemaObjectFilePath = path.resolve(options.schema);

      const schemaTextBuffer = fs.readFileSync(schemaObjectFilePath);
      schemaObject = JSON.parse(schemaTextBuffer);
    }

    // Creating the database instance with the specified JSON file
    const dbInstance = jaysonDB.DB.DB.getDB(resolvedPath, schemaObject);

    // Starting the REPL server
    const replServer = repl.start({
      prompt: `${programName} (${dbInstance.name}): `,
    });

    replServer.context.db = dbInstance;
  });

// 'repl' function of the CLI tool
program
  .command('repl')
  .description('Enter a Node REPL to test out the database library')
  .action(() => {
    const replServer = repl.start({
      prompt: `${programName} REPL: `,
    });

    replServer.context.DB = jaysonDB.DB.DB;
  });

program.parse(process.argv);

module.exports = jaysonDB.DB;
