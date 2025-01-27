import fs from "fs-extra";
import path from "path";
import { updateAppFile } from "../utils/updateAppFile.js";
import { promptLanguage } from "../utils/helper.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const addFeature = async (feature, projectDir) => {
  try {
    const configPath = path.join(projectDir, ".exo-config.json");

    const config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
      : { features: [] };

    if (config.features.includes(feature)) {
      console.log(`✅ The ${feature} feature is already added.`);
      return;
    }

    const language = await promptLanguage();
    const featureDir = path.resolve(__dirname, `../templates/express/${language}/${feature}`);
    if (!fs.existsSync(featureDir)) {
      console.error(`❌ Template for ${feature} is not available.`);
      return;
    }

    await fs.copy(featureDir, projectDir);
    const appFilePath = path.join(projectDir, `src/app.${language === "typescript" ? "ts" : "js"}`);
    await updateAppFile(appFilePath, feature, language);

    config.features.push(feature);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`🎉 Added ${feature} feature successfully.`);
  } catch (error) {
    console.error(`❌ Error adding feature: ${(error).message}`);
  }
};
