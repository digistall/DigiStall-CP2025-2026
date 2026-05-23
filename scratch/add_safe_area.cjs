const fs = require('fs');
const path = require('path');

const targetFiles = [
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\Dashboard\\DashboardScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\Report\\ComplaintScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\Settings\\SettingsScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\Notifications\\NotificationsScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\Documents\\DocumentsScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\Payment\\PaymentScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\OwnedStalls\\OwnedStallsScreen.js',
  'c:\\Users\\Jeno\\DigiStall-CP2025-2026\\FRONTEND\\MOBILE\\STALLHOLDER\\StallHolder\\StallScreen\\JoinedStalls\\JoinedStallsScreen.js',
];

for (const filePath of targetFiles) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has SafeAreaProvider
    if (content.includes('SafeAreaProvider')) {
      console.log(`Already has SafeAreaProvider: ${path.basename(filePath)}`);
      continue;
    }

    // Replace the import
    if (content.includes('import { SafeAreaView } from "react-native-safe-area-context"')) {
      content = content.replace('import { SafeAreaView } from "react-native-safe-area-context"', 'import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"');
    } else if (content.includes("import { SafeAreaView } from 'react-native-safe-area-context'")) {
      content = content.replace("import { SafeAreaView } from 'react-native-safe-area-context'", "import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'");
    } else {
      // Add import at the top
      content = "import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';\n" + content;
    }

    // Wrap the top level SafeAreaView with SafeAreaProvider
    // Usually it looks like: return ( \n <SafeAreaView
    const returnRegex = /return\s*\(\s*<SafeAreaView([^>]*)>/s;
    if (returnRegex.test(content)) {
      content = content.replace(returnRegex, 'return (\n    <SafeAreaProvider>\n      <SafeAreaView$1>');
      
      // Replace the closing tag
      // We need to replace the last </SafeAreaView> before closing parentheses.
      const closingRegex = /<\/SafeAreaView>\s*\)\s*;\s*};/s;
      if (closingRegex.test(content)) {
        content = content.replace(closingRegex, '</SafeAreaView>\n    </SafeAreaProvider>\n  );\n};\n');
      } else {
         const altClosingRegex = /<\/SafeAreaView>\s*\)\s*}/s;
         if (altClosingRegex.test(content)) {
           content = content.replace(altClosingRegex, '</SafeAreaView>\n    </SafeAreaProvider>\n  )}');
         }
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`Modified: ${path.basename(filePath)}`);
    } else {
      console.log(`Could not find return (<SafeAreaView...) in: ${path.basename(filePath)}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}
