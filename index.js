#!/usr/bin/env node
const repl = require('repl');

const program = require('commander');
const db = require('./src/db');

// CLI tool program
program
  .version('0.0.1', '-v, --version');

// 'create' function of the CLI tool
program
  .command('create <name>')
  .description('Create an instance of the database and enter to a Node REPL with the database instance')
  .option('-p, --path [filePath]', 'The output path of the JSON to be exported', './')
  .action((name, options) => {
    const dbInstance = new db.DB(name, options.path);
    const replServer = repl.start({
      prompt: `jayson-db (${name}): `,
    });

    replServer.context.db = dbInstance;
  });

// 'repl' function of the CLI tool
program
  .command('repl')
  .description('Enter a Node REPL to test out the database library')
  .action(() => {
    const replServer = repl.start({
      prompt: 'jayson-db REPL: ',
    });

    replServer.context.DB = db.DB;
  });

program.parse(process.argv);

module.exports = db;
