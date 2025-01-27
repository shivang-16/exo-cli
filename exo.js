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
  .command("create")
  .description("Create a new project")
  .option("-l, --list", "List all available project types")
  .option("-n, --name <name>", "Project name")
  .option("--typescript", "Use TypeScript")
  .option("--javascript", "Use JavaScript")
  .argument("[type]", "Project type (e.g., express, react, next)")
  .action((type, options) => {
    createProject({ 
      type, 
      name: options.name,
      language: options.typescript ? "typescript" : options.javascript ? "javascript" : null,
      ...options 
    });
  });

// Command for adding a feature to an existing project
program
  .command("add")
  .description("Add a feature to your project")
  .option("-l, --list", "List all available features")
  .argument("[feature]", "Feature to add (e.g., auth, mail)")
  .action((feature, options) => {
    addFeature({ feature, projectDir: process.cwd(), ...options });
  });

program.parse(process.argv);
