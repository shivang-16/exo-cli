import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promptLanguage } from "../utils/helper.js";
import inquirer from 'inquirer';

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
    
    // Use provided name or default to projectType-project
    const projectName = options.name || `${projectType}-project`;
    
    const templatesDir = path.resolve(__dirname, `../templates/${projectType}/${language}/base`);
    const targetDir = path.resolve(process.cwd(), projectName);

    if (!fs.existsSync(templatesDir)) {
      console.error(`❌ Template for ${projectType} in ${language} is not available.`);
      return;
    }

    await fs.copy(templatesDir, targetDir);
    console.log(`🎉 Created ${projectType} project in ${language} at ${targetDir}`);
  } catch (error) {
    console.error(`❌ Error creating project: ${error.message}`);
  }
};
