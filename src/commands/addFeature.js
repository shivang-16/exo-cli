import fs from "fs-extra";
import path from "path";
import { promptLanguage } from "../utils/helper.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';
import { mergeDirectories } from "../utils/mergeFiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_OPTIONS = {
  mongodb: 'MongoDB with Mongoose',
  postgres: 'PostgreSQL with Prisma'
};

export const addFeature = async ({ feature, projectDir, list }) => {
  try {
    // Read config first to check for project type and language
    const configPath = path.join(projectDir, ".exo-config.json");
    let config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
      : null;

    // If no config or no project type, suggest creating a project first
    if (!config || !config.projectType) {
      console.error('❌ No exo project found in the current directory.');
      console.log('💡 Try creating a new project first:');
      console.log('   exo create <project-name>');
      return;
    }

    // Check if feature is compatible with project type
    const featuresPath = path.resolve(__dirname, `../templates/${config.projectType}/${config.language}`);
    const availableFeatures = fs.existsSync(featuresPath) 
      ? fs.readdirSync(featuresPath).filter(f => f !== 'base')
      : [];

    if (availableFeatures.length === 0) {
      console.error(`❌ No features available for ${config.projectType} project type.`);
      return;
    }

    // Use language from config if available, otherwise prompt
    const language = config.language || await promptLanguage();
    
    // If language wasn't in config, save it
    if (!config.language) {
      config.language = language;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

  
    if (availableFeatures.length === 0) {
      console.error('❌ No features available for this project type.');
      return;
    }

    // If --list flag is used, show features and prompt for selection
    if (list) {
      const { selectedFeature: listSelectedFeature } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFeature',
          message: 'Select a feature to add:',
          choices: availableFeatures
        }
      ]);
      feature = listSelectedFeature;
    }

    // Rest of the feature selection and validation logic
    let selectedFeature = feature;
    if (!selectedFeature) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'feature',
          message: 'Select a feature to add:',
          choices: availableFeatures
        }
      ]);
      selectedFeature = answer.feature;
    }

    // Validate if specified feature exists
    if (!availableFeatures.includes(selectedFeature)) {
      console.error(`❌ Invalid feature. Available features: ${availableFeatures.join(', ')}`);
      return;
    }

    // const configPath = path.join(projectDir, ".exo-config.json");
    // let config = fs.existsSync(configPath)
    //   ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    //   : { features: [] };

    if (config.features.includes(selectedFeature)) {
      console.log(`✅ The ${selectedFeature} feature is already added.`);
      return;
    }

    // In the addFeature function, replace the feature copying section:
    // Check if auth feature requires database
    if (selectedFeature === 'auth' || selectedFeature === 'google-auth') {
      // Check if database is configured
      if (!config.database) {
        console.error(`❌ No database configured. Please add a database first using 'exo add database'`);
        return;
      }
      console.log(`ℹ️ Using existing ${config.database} database configuration`);
    }

    // Handle direct database addition
    if (feature === 'database') {
      if (config.database) {
        console.log(`ℹ️ Database (${config.database}) is already configured`);
        return;
      }

      const { database } = await inquirer.prompt([
        {
          type: 'list',
          name: 'database',
          message: 'Select a database to add:',
          choices: Object.entries(DATABASE_OPTIONS).map(([value, name]) => ({
            name,
            value
          }))
        }
      ]);

      const dbTemplateDir = path.resolve(__dirname, `../templates/${config.projectType}/${config.language}/database/${database}`);
      if (!fs.existsSync(dbTemplateDir)) {
        console.error(`❌ Database template for ${database} not found`);
        return;
      }

      await mergeDirectories(dbTemplateDir, projectDir);
      console.log(`✅ Added ${database} database configuration`);

      // Update config with database info
      config.database = database;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`🎉 Database setup completed successfully`);
      return;
    }

    // Continue with feature addition
    if (selectedFeature === 'auth' || selectedFeature === 'auth') {
      // First copy base auth files
      const baseAuthDir = path.resolve(__dirname, `../templates/${config.projectType}/${config.language}/auth/base`);
      if (!fs.existsSync(baseAuthDir)) {
        console.error(`❌ Base auth template not found`);
        return;
      }
      
      await mergeDirectories(baseAuthDir, projectDir);
      console.log(`✅ Added base auth files`);

      // Then copy database-specific auth files
      const dbAuthDir = path.resolve(__dirname, `../templates/${config.projectType}/${config.language}/auth/${config.database}`);
      if (!fs.existsSync(dbAuthDir)) {
        console.error(`❌ Auth template for ${config.database} not found`);
        return;
      }

      await mergeDirectories(dbAuthDir, projectDir);
      console.log(`✅ Added ${config.database}-specific auth files`);

      // Update config and install dependencies
      config.features.push(selectedFeature);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`🎉 Auth feature added successfully`);

      // Run npm install
      console.log('📦 Installing dependencies...');
      const { execa } = await import('execa');
      try {
        await execa('npm', ['install'], { cwd: projectDir, stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
      } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
      }
      return;
    }

    // Run npm install after adding feature
    console.log('📦 Installing dependencies...');
    const { execa } = await import('execa');
    try {
      await execa('npm', ['install'], { cwd: projectDir, stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
    }

  } catch (error) {
    console.error(`❌ Error adding feature: ${error.message}`);
  }
};
