import fs from "fs-extra";
import path from "path";
import { updateAppFile } from "../utils/updateAppFile.js";
import { promptLanguage } from "../utils/helper.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
      : { features: [] };

    if (config.features.includes(selectedFeature)) {
      console.log(`✅ The ${selectedFeature} feature is already added.`);
      return;
    }

    const featureDir = path.resolve(__dirname, `../templates/express/${language}/${selectedFeature}`);
    await fs.copy(featureDir, projectDir);
    const appFilePath = path.join(projectDir, `src/app.${language === "typescript" ? "ts" : "js"}`);
    await updateAppFile(appFilePath, selectedFeature, language);

    config.features.push(selectedFeature);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`🎉 Added ${selectedFeature} feature successfully.`);
  } catch (error) {
    console.error(`❌ Error adding feature: ${error.message}`);
  }
};
