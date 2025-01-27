import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promptLanguage } from "../utils/helper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createProject = async (projectType) => {
  try {
    const language = await promptLanguage();

    const templatesDir = path.resolve(__dirname, `../templates/${projectType}/${language}/base`);
    const targetDir = path.resolve(process.cwd(), `${projectType}-project`);

    if (!fs.existsSync(templatesDir)) {
      console.error(`❌ Template for ${projectType} in ${language} is not available.`);
      return;
    }

    await fs.copy(templatesDir, targetDir);
    console.log(`🎉 Created ${projectType} project in ${language} at ${targetDir}`);
  } catch (error) {
    console.error(`❌ Error creating project: ${(error).message}`);
  }
};
