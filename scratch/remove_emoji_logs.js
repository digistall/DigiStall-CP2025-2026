const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../BACKEND');
const regex = /^\s*console\.(log|info|warn|error)\s*\(\s*(['"`])[🔍🎯⚠️\?]/;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  
  const newLines = lines.filter(line => {
    // Only remove if it's purely a debug log with these emojis and doesn't contain critical logic
    if (regex.test(line)) {
      console.log(`Removing from ${path.basename(filePath)}: ${line.trim()}`);
      changed = true;
      return false;
    }
    
    // Also remove multi-line console.logs that start with an emoji if possible, 
    // but a single line filter is safer for now. We can just use the simple line filter.
    // Let's refine the regex to catch anywhere in the line just in case, but safe.
    return true;
  });
  
  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  }
}

processDirectory(targetDir);
console.log('Cleanup complete.');
