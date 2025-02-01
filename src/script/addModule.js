import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Utility function to copy files recursively
function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Function to update app.ts
function updateAppTs() {
  const appTsPath = path.join(__dirname, '../src/app.ts');
  let appTsContent = fs.readFileSync(appTsPath, 'utf-8');

  // Check if `authMiddleware` and `authRoutes` are already imported
  if (!appTsContent.includes("authMiddleware")) {
    // Add imports
    const imports = `
import authMiddleware from './auth/middlewares/authMiddleware';
import authRoutes from './auth/routes/authRoutes';`;

    appTsContent = appTsContent.replace(
      "const app: Application = express();",
      `${imports}\n\nconst app: Application = express();`
    );

    // Add middleware
    const middleware = `
// Auth middleware
app.use(authMiddleware);

// Auth routes
app.use('/api/auth', authRoutes);
`;
    appTsContent = appTsContent.replace("// Routes", `${middleware}\n// Routes`);

    // Write the updated content back to app.ts
    fs.writeFileSync(appTsPath, appTsContent, 'utf-8');
    console.log('✅ Updated app.ts to include auth imports and middleware.');
  } else {
    console.log('⚠️ authMiddleware and authRoutes are already included in app.ts.');
  }
}

// Function to install npm packages
function installPackages(packages) {
  console.log('📦 Installing required npm packages...');
  execSync(`npm install ${packages.join(' ')}`, { stdio: 'inherit' });
}

// Main function to add auth module
function addAuthModule() {
  const authSrc = path.join(__dirname, '../templates/auth');
  const authDest = path.join(__dirname, '../src/auth');

  // Copy auth folder
  console.log('📂 Copying auth folder to src...');
  copyFolderSync(authSrc, authDest);

  // Update app.ts
  updateAppTs();

  // Install required npm packages
  const requiredPackages = ['jsonwebtoken', 'bcrypt', '@types/jsonwebtoken', '@types/bcrypt']; // Add any necessary packages here
  installPackages(requiredPackages);

  console.log('✅ Auth module added successfully!');
}

// Run the script
addAuthModule();
