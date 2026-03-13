const { JSDOM } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync("chat.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously" });
console.log("No errors on init!");
