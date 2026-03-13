const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Intercept requests to see if navigation occurs
  page.on('request', req => {
    console.log("REQUEST:", req.url());
  });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto("http://localhost:8888/chat");

  console.log("Typing message...");
  await page.type("#user-input", "Plumbing");
  
  console.log("Clicking send...");
  await page.click("#send-btn");
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.$eval("#user-input", el => el.value);
  console.log("Input value after click:", content);
  
  const messages = await page.$$eval(".msg", els => els.map(e => e.textContent));
  console.log("Messages count:", messages.length);
  console.log("Last message:", messages[messages.length - 1]);
  
  await browser.close();
})();
