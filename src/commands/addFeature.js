import fs from "fs-extra";
import path from "path";
import { updateAppFile } from "../utils/updateAppFile.js";
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
    const language = await promptLanguage();
    const featuresPath = path.resolve(__dirname, `../templates/express/${language}`);
    const availableFeatures = fs.existsSync(featuresPath) 
      ? fs.readdirSync(featuresPath).filter(f => f !== 'base')
      : [];

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

    const configPath = path.join(projectDir, ".exo-config.json");
    let config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
      : { features: [] };

    if (config.features.includes(selectedFeature)) {
      console.log(`✅ The ${selectedFeature} feature is already added.`);
      return;
    }

    // In the addFeature function, replace the feature copying section:
    // Check if auth feature requires database
    if (selectedFeature === 'auth') {
      const { database } = await inquirer.prompt([
        {
          type: 'list',
          name: 'database',
          message: 'Select a database for authentication:',
          choices: Object.entries(DATABASE_OPTIONS).map(([value, name]) => ({
            name,
            value
          }))
        }
      ]);

      // Add database first
      const dbTemplateDir = path.resolve(__dirname, `../templates/express/${language}/database/${database}`);
      if (!fs.existsSync(dbTemplateDir)) {
        console.error(`❌ Database template for ${database} not found`);
        return;
      }

      await mergeDirectories(dbTemplateDir, projectDir);
      console.log(`✅ Added ${database} database configuration`);

      // Update config with database info
      const configPath = path.join(projectDir, ".exo-config.json");
      const config = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
        : { features: [], database: null };

      config.database = database;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    // Continue with feature addition
    const featureDir = path.resolve(__dirname, `../templates/express/${language}/${selectedFeature}`);
    if (!fs.existsSync(featureDir)) {
      console.error(`❌ Feature template for ${selectedFeature} not found`);
      return;
    }
    
    await mergeDirectories(featureDir, projectDir);
    console.log(`✅ Merged ${selectedFeature} feature files`);
    
    // Update config with feature
     config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
      : { features: [], database: null };

    config.features.push(selectedFeature);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`🎉 Added ${selectedFeature} feature successfully.`);
  } catch (error) {
    console.error(`❌ Error adding feature: ${error.message}`);
  }
};
