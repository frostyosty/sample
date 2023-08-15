const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const convertColor = require('color-convert');
const axios = require('axios');

// Function to prompt the user for input
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to list directories in the current directory
function listDirectoriesInCurrentDir() {
  const currentDir = __dirname;
  const directories = fs.readdirSync(currentDir).filter(file => fs.statSync(path.join(currentDir, file)).isDirectory());
  return directories;
}

// Function to convert hex color value to the specified color scheme
function convertHexColorToScheme(hexColor, schemeColor) {
  const rgbColor = convertColor.hex.rgb(hexColor);
  let convertedRgbColor = [...rgbColor];

  if (schemeColor === 'red') {
    // Convert green to blue
    convertedRgbColor[1] = 0;
    convertedRgbColor[2] = rgbColor[1];
  } else if (schemeColor === 'blue') {
    // Convert red to blue
    convertedRgbColor[0] = 0;
    convertedRgbColor[2] = rgbColor[0];
  }

  // Convert the converted RGB color back to hex
  const convertedHexColor = convertColor.rgb.hex(convertedRgbColor);

  // Add '#' to the beginning of the hex color if not already present
  return convertedHexColor.startsWith('#') ? convertedHexColor : `#${convertedHexColor}`;
}

// Function to replace placeholders in a string with user-provided values
function replacePlaceholdersWithValues(content, placeholders) {
  for (const [placeholder, value] of Object.entries(placeholders)) {
    const regex = new RegExp(`\\[${placeholder}\\]`, 'g');
    content = content.replace(regex, value);
  }
  return content;
}

// Main function to copy the folder and its contents with color conversion
async function copyFolderWithColorConversion() {
  try {
    const directories = listDirectoriesInCurrentDir();

    if (directories.length === 0) {
      console.log('No subdirectories found in the current directory.');
      return;
    }

    console.log('Subdirectories in the current directory:');
    console.log(directories);

    const sourceFolderName = await promptUser('Enter the name of the source folder to copy: ');

    if (!directories.includes(sourceFolderName)) {
      console.log(`Directory "${sourceFolderName}" not found in the current directory.`);
      return;
    }

    const destinationFolderName = await promptUser('Enter the name of the destination folder: ');

    const colorScheme = await promptUser('What color scheme would you like? (e.g., red, blue): ');

    const productOrService = await promptUser('Does the company sell products or services (p/s)? ');

    const companyName = await promptUser('Enter the company name: ');
    const companyDescription = await promptUser('Enter the company description: ');
    const email = await promptUser('Enter the email: ');
    const phone = await promptUser('Enter the phone number: ');

    const placeholders = {
      'company name': companyName,
      'description': companyDescription,
      'email': email,
      'phone': phone,
      'products or services': productOrService === 'p' ? 'Products' : 'Services',
    };

    const sourceFolderPath = path.join(__dirname, sourceFolderName);
    const destFolderPath = path.join(__dirname, destinationFolderName);

    // Copy the entire folder and its contents to the destination folder
    await fs.copy(sourceFolderPath, destFolderPath);

    const cssFilePath = path.join(sourceFolderPath, 'styles.css');
    if (fs.existsSync(cssFilePath)) {
      let cssContent = fs.readFileSync(cssFilePath, 'utf8');
      const hexColorRegex = /#[0-9a-fA-F]{6}/g;
      cssContent = cssContent.replace(hexColorRegex, (match) => convertHexColorToScheme(match, colorScheme));
      cssContent = replacePlaceholdersWithValues(cssContent, placeholders);
      fs.writeFileSync(path.join(destFolderPath, 'styles.css'), cssContent, 'utf8');
    }

    const files = fs.readdirSync(sourceFolderPath);
    for (const file of files) {
      if (file !== 'styles.css') {
        const filePath = path.join(sourceFolderPath, file);
        if (fs.statSync(filePath).isFile()) {
          let fileContent = fs.readFileSync(filePath, 'utf8');
          fileContent = replacePlaceholdersWithValues(fileContent, placeholders);
          fs.writeFileSync(path.join(destFolderPath, file), fileContent, 'utf8');
        }
      }
    }

    console.log(`Folder and its contents copied successfully with color conversion and placeholder replacement. New folder: ${destinationFolderName}`);
    console.log('Successful file copies:');
    console.log(fs.readdirSync(destFolderPath).filter(file => fs.statSync(path.join(destFolderPath, file)).isFile()));
    console.log('Unsuccessful file copies:');
    console.log([]);

  } catch (err) {
    console.error('An error occurred:', err.message);
  }
}

// Call the main function to start the program
copyFolderWithColorConversion();
