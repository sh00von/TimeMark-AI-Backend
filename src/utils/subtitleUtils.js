function cleanSubtitleFormat(subtitleText) {
  // Split into lines and process
  const lines = subtitleText.split('\n');
  const cleanedLines = [];
  let currentSubtitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Skip line numbers
    if (/^\d+$/.test(line)) continue;
    
    // Skip timestamp lines
    if (line.includes('-->')) continue;
    
    // Add subtitle text
    if (line) {
      currentSubtitle += line + ' ';
    }
  }

  // Remove extra spaces and join
  return currentSubtitle.trim().replace(/\s+/g, ' ');
}

module.exports = { cleanSubtitleFormat }; 