#!/usr/bin/env node

import { Command } from "commander";
import { createProject } from "./src/commands/create.js";
import { addFeature } from "./src/commands/addFeature.js";

const program = new Command();

program
  .name("exo")
  .description("A CLI")
  .version("1.0.0");

// Command for creating a new project
program
  .command("create <projectType>")
  .description("Create a new project (e.g., express, react, next, flask)")
  .action((projectType) => {
    createProject(projectType);
  });

// Command for adding a feature to an existing project
program
  .command("add <feature>")
  .description("Add a feature to your project (e.g., auth, mail)")
  .action((feature) => {
    addFeature(feature, process.cwd());
  });

program.parse(process.argv);
