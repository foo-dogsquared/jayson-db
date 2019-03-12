#!/usr/bin/env node
const db = require('./src/db');
const repl = require('repl');
const fs = require('fs');

const program = require('commander');
const packageJSON = JSON.parse(fs.readFileSync('package.json'));

// CLI tool program
program
  .version(packageJSON.version, '-v, --version')

// 'create' function of the CLI tool
program
  .command('create <name>')
  .description('Create an instance of the database with the name and enter to a Node REPL with the database instance')
  .option('-p, --path [filePath]', 'The output path of the JSON to be exported', './')
  .action(function (name, options) {
    const dbInstance = new db.DB(name, options.path);
    const replServer = repl.start({
      prompt: `JSON-DB (${name}): `
    })

    replServer.context.db = dbInstance;
  })

// 'repl' function of the CLI tool
program
  .command('repl')
  .description('Enter a Node REPL to test out the database library')
  .action(function () {
    const replServer = repl.start({
      prompt: `JSON-DB REPL: `
    })

    replServer.context.DB = db.DB
  })

program.parse(process.argv);

module.exports = db;
