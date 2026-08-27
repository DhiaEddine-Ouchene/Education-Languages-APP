const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/games/create?type=FILL_GAP_WORD', { waitUntil: 'networkidle2' });
  
  // Wait for the topic input to appear
  await page.waitForSelector('input[placeholder*="Topic"]');
  
  // Type "Food" into the topic input
  await page.type('input[placeholder*="Topic"]', 'Food');
  
  // Click the Generate button (it should say "Generate 10 Items")
  const buttons = await page.$$('button');
  let generateBtn;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Generate 10 Items')) {
      generateBtn = btn;
      break;
    }
  }
  
  if (generateBtn) {
    await generateBtn.click();
    console.log("Clicked Generate. Waiting for generation...");
    
    // Wait until the "Generating items..." button goes back to "Generate" or the debug output appears with items
    await page.waitForFunction(() => {
      const debugDiv = Array.from(document.querySelectorAll('.bg-red-50')).find(el => el.textContent.includes('DEBUG initial:'));
      if (!debugDiv) return false;
      const text = debugDiv.textContent;
      return text.includes('sentenceItems') && text.length > 50;
    }, { timeout: 30000 });
    
    const debugText = await page.evaluate(() => {
      const debugDiv = Array.from(document.querySelectorAll('.bg-red-50')).find(el => el.textContent.includes('DEBUG initial:'));
      return debugDiv ? debugDiv.textContent : 'No debug output found';
    });
    
    console.log("DEBUG OUTPUT:", debugText);
  } else {
    console.log("Could not find Generate button");
  }
  
  await browser.close();
})();
