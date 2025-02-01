import fs from "fs-extra";
import path from "path";

export const updateAppFile = async (appFilePath, feature, language) => {
  try {
    if (!fs.existsSync(appFilePath)) {
      throw new Error(`Base app file not found at ${appFilePath}`);
    }

    // Get the feature's app file path
    const featureDir = path.dirname(path.dirname(appFilePath)); // Go up to src directory
    const featureAppPath = path.join(
      featureDir, 
      'features', 
      feature, 
      `app.${language === "typescript" ? "ts" : "js"}`
    );

    if (!fs.existsSync(featureAppPath)) {
      console.warn(`⚠️ No app file found for feature ${feature}, skipping app file update`);
      return;
    }

    // Read both files
    const baseApp = await fs.readFile(appFilePath, "utf-8");
    const featureApp = await fs.readFile(featureAppPath, "utf-8");

    // Split files into lines
    const baseLines = baseApp.split('\n');
    const featureLines = featureApp.split('\n');

    // Track sections we want to merge
    const sections = {
      imports: [],
      middleware: [],
      routes: [],
      other: []
    };

    // Extract new lines from feature app file
    featureLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !baseLines.includes(line)) {
        if (trimmedLine.startsWith('import ')) {
          sections.imports.push(line);
        } else if (trimmedLine.startsWith('app.use(')) {
          sections.middleware.push(line);
        } else if (trimmedLine.includes('Router')) {
          sections.routes.push(line);
        } else {
          sections.other.push(line);
        }
      }
    });

    // Find insertion points in base app
    let newContent = baseLines.join('\n');
    
    // Add imports at the top after the last import
    if (sections.imports.length > 0) {
      const lastImportIndex = baseLines.findLastIndex(line => line.trim().startsWith('import'));
      if (lastImportIndex !== -1) {
        const before = newContent.slice(0, newContent.indexOf(baseLines[lastImportIndex]) + baseLines[lastImportIndex].length);
        const after = newContent.slice(newContent.indexOf(baseLines[lastImportIndex]) + baseLines[lastImportIndex].length);
        newContent = before + '\n' + sections.imports.join('\n') + after;
      }
    }

    // Add middleware before the module.exports or export default
    if (sections.middleware.length > 0) {
      const exportIndex = baseLines.findIndex(line => 
        line.includes('module.exports') || line.includes('export default')
      );
      if (exportIndex !== -1) {
        const insertPoint = newContent.indexOf(baseLines[exportIndex]);
        newContent = newContent.slice(0, insertPoint) + 
                    sections.middleware.join('\n') + '\n\n' + 
                    newContent.slice(insertPoint);
      }
    }

    // Add other lines before exports
    if (sections.other.length > 0) {
      const exportIndex = baseLines.findIndex(line => 
        line.includes('module.exports') || line.includes('export default')
      );
      if (exportIndex !== -1) {
        const insertPoint = newContent.indexOf(baseLines[exportIndex]);
        newContent = newContent.slice(0, insertPoint) + 
                    sections.other.join('\n') + '\n\n' + 
                    newContent.slice(insertPoint);
      }
    }

    // Write the updated content back to the base app file
    await fs.writeFile(appFilePath, newContent, "utf-8");
    console.log(`✅ Updated app file with ${feature} configurations`);
  } catch (error) {
    console.error(`❌ Error updating app file: ${error.message}`);
  }
};
