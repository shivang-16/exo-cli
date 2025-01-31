import fs from "fs-extra";
import path from "path";

export const mergeDirectories = async (sourceDir, targetDir) => {
  try {
    // Read all files and directories from source
    const items = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(sourceDir, item.name);
      const targetPath = path.join(targetDir, item.name);

      if (item.isDirectory()) {
        // If directory exists, merge contents
        if (fs.existsSync(targetPath)) {
          await mergeDirectories(sourcePath, targetPath);
        } else {
          // If directory doesn't exist, copy it entirely
          await fs.copy(sourcePath, targetPath);
        }
      } else {
        // Handle file merging
        if (fs.existsSync(targetPath)) {
          // File exists, merge content
          const sourceContent = await fs.readFile(sourcePath, 'utf-8');
          const targetContent = await fs.readFile(targetPath, 'utf-8');

          if (path.basename(item.name) === 'package.json') {
            // Special handling for package.json
            await mergePackageJson(sourcePath, targetPath);
          } else if (item.name.endsWith('.ts') || item.name.endsWith('.js')) {
            // For TypeScript/JavaScript files, merge intelligently
            await mergeCodeFiles(sourceContent, targetContent, targetPath);
          } else {
            // For other files, only copy if different
            if (sourceContent !== targetContent) {
              await fs.writeFile(targetPath, sourceContent);
            }
          }
        } else {
          // File doesn't exist, copy it
          await fs.copy(sourcePath, targetPath);
        }
      }
    }
  } catch (error) {
    throw new Error(`Error merging directories: ${error.message}`);
  }
};

const mergePackageJson = async (sourcePath, targetPath) => {
  const sourcePackage = JSON.parse(await fs.readFile(sourcePath, 'utf-8'));
  const targetPackage = JSON.parse(await fs.readFile(targetPath, 'utf-8'));

  // Merge dependencies and devDependencies
  targetPackage.dependencies = {
    ...targetPackage.dependencies,
    ...sourcePackage.dependencies
  };
  targetPackage.devDependencies = {
    ...targetPackage.devDependencies,
    ...sourcePackage.devDependencies
  };

  // Write merged package.json
  await fs.writeFile(targetPath, JSON.stringify(targetPackage, null, 2));
};

const mergeCodeFiles = async (sourceContent, targetContent, targetPath) => {
  const sourceLines = sourceContent.split('\n');
  const targetLines = targetContent.split('\n');
  const newLines = [];
  const importSection = [];
  const routeSection = [];
  const otherSection = [];

  // Find the last import index first
  let lastImportIndex = -1;
  targetLines.forEach((line, index) => {
    if (line.trim().startsWith('import ')) {
      lastImportIndex = index;
    }
  });

  // Collect different sections from source
  sourceLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('import ')) {
      if (!targetContent.includes(line)) {
        importSection.push(line);
      }
    } else if (trimmedLine.startsWith('app.use') && trimmedLine.includes('Router')) {
      // Collect route declarations
      routeSection.push(line);
    } else if (trimmedLine && !targetContent.includes(line)) {
      otherSection.push(line);
    }
  });

  // Process the target file line by line
  let routeSectionFound = false;
  let hasAddedRoutes = false;

  targetLines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Add imports after last import
    if (trimmedLine.startsWith('import ') && index === lastImportIndex) {
      newLines.push(line);
      newLines.push(...importSection);
      return;
    }

    // Add routes under the Routes section
    if (trimmedLine === '// Routes') {
      routeSectionFound = true;
      newLines.push(line);
      return;
    }

    if (routeSectionFound && trimmedLine.startsWith('app.use') && !hasAddedRoutes) {
      newLines.push(line); // Add the existing api routes line
      // Add new routes indented properly
      routeSection.forEach(route => {
        newLines.push(route);
      });
      hasAddedRoutes = true;
      return;
    }

    newLines.push(line);
  });

  // Add remaining sections before export
  const lastExportIndex = newLines.findIndex(line => 
    line.includes('export default') || line.includes('module.exports')
  );

  if (lastExportIndex !== -1) {
    newLines.splice(lastExportIndex, 0, ...otherSection);
  } else {
    newLines.push(...otherSection);
  }

  await fs.writeFile(targetPath, newLines.join('\n'));
};