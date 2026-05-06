#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('agentforge')
  .description('CLI to generate and manage agents')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new agent project')
  .action(() => {
    console.log('Initializing AgentForge...');
  });

program.parse(process.argv);
