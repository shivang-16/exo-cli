import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promptLanguage } from "../utils/helper.js";
import inquirer from 'inquirer';
import { mergeDirectories } from "../utils/mergeFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_TYPES = ['express', 'react', 'next'];
const DATABASE_OPTIONS = {
  mongodb: 'MongoDB with Mongoose',
  postgres: 'PostgreSQL with Prisma'
};

export const createProject = async (options) => {
  try {
    let projectType;

    if (options.list) {   
      const { selectedType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedType',
          message: 'Select a project type:',
          choices: PROJECT_TYPES
        }
      ]);
      projectType = selectedType;
    } else if (options.type) {
      if (!PROJECT_TYPES.includes(options.type)) {
        console.error(`❌ Invalid project type. Available types: ${PROJECT_TYPES.join(', ')}`);
        return;
      }
      projectType = options.type;
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectType',
          message: 'Select a project type:',
          choices: PROJECT_TYPES
        }
      ]);
      projectType = answer.projectType;
    }

    // Use provided language or prompt for it
    const language = options.language || await promptLanguage();
    const projectName = options.name || `${projectType}-project`;
    const targetDir = path.resolve(process.cwd(), projectName);

    // Check if target directory already exists
    if (fs.existsSync(targetDir)) {
      console.error(`❌ Directory ${projectName} already exists`);
      return;
    }

    // Create target directory first
    await fs.ensureDir(targetDir);

    const templatesDir = path.resolve(__dirname, `../templates/${projectType}/${language}/base`);
    if (!fs.existsSync(templatesDir)) {
      console.error(`❌ Template for ${projectType} in ${language} is not available.`);
      return;
    }

    let selectedDatabase = null;
    
    // Ask for database setup only for Express projects
    if (projectType === 'express') {
      const { wantDatabase } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'wantDatabase',
          message: 'Would you like to set up a database?',
          default: false
        }
      ]);

      if (wantDatabase) {
        const { database } = await inquirer.prompt([
          {
            type: 'list',
            name: 'database',
            message: 'Select your database:',
            choices: Object.entries(DATABASE_OPTIONS).map(([value, name]) => ({
              name,
              value
            }))
          }
        ]);
        selectedDatabase = database;
      }
    }

    // Copy files with filter to exclude problematic directories
    await fs.copy(templatesDir, targetDir, {
      filter: (src) => {
        return !src.includes('node_modules') && 
               !src.includes('.git') && 
               !src.includes('tsserver');
      }
    });

    // Handle database setup if selected
    if (selectedDatabase) {
      const dbTemplateDir = path.resolve(__dirname, `../templates/express/${language}/database/${selectedDatabase}`);
      if (!fs.existsSync(dbTemplateDir)) {
        console.warn(`⚠️ Database template for ${selectedDatabase} not found`);
      } else {
        // Use mergeDirectories instead of direct copy
        await mergeDirectories(dbTemplateDir, targetDir);
        console.log(`✅ Added ${selectedDatabase} database configuration`);
        
        // Store database info in config
        const configPath = path.join(targetDir, ".exo-config.json");
        const config = fs.existsSync(configPath)
          ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
          : { features: [] };
        
        config.database = selectedDatabase;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }
    }

    // Handle features if provided
    // In the createProject function, replace the feature handling section:
    if (options.features && options.features.length > 0) {
      for (const feature of options.features) {
        const featureDir = path.resolve(__dirname, `../templates/${projectType}/${language}/${feature}`);
        if (!fs.existsSync(featureDir)) {
          console.warn(`⚠️ Feature template '${feature}' not found, skipping...`);
          continue;
        }
        
        // Use the new merge function instead of direct copy
        await mergeDirectories(featureDir, targetDir);
        console.log(`✅ Merged ${feature} feature files`);
      }
    
      // Update config file
      const configPath = path.join(targetDir, ".exo-config.json");
      const config = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
        : { features: [] };
      
      config.features.push(...options.features);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    console.log(`🎉 Created ${projectType} project in ${language} at ${targetDir}`);
    if (options.features && options.features.length > 0) {
      console.log(`✅ Added features: ${options.features.join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Error creating project: ${error.message}`);
  }
};
