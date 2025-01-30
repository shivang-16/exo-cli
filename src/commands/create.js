import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promptLanguage } from "../utils/helper.js";
import inquirer from 'inquirer';
import { updateAppFile } from "../utils/updateAppFile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_TYPES = ['express', 'react', 'next'];

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

    // Copy files with filter to exclude problematic directories
    await fs.copy(templatesDir, targetDir, {
      filter: (src) => {
        return !src.includes('node_modules') && 
               !src.includes('.git') && 
               !src.includes('tsserver');
      }
    });

    // Handle features if provided
    if (options.features && options.features.length > 0) {
      for (const feature of options.features) {
        const featureDir = path.resolve(__dirname, `../templates/${projectType}/${language}/${feature}`);
        if (!fs.existsSync(featureDir)) {
          console.warn(`⚠️ Feature template '${feature}' not found, skipping...`);
          continue;
        }
        await fs.copy(featureDir, targetDir);
        await updateAppFile(
          path.join(targetDir, `src/app.${language === "typescript" ? "ts" : "js"}`),
          feature,
          language
        );
      }

      // Create or update exo-config.json
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
