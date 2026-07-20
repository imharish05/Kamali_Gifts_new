const https = require("https");

async function run() {
  https.get("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
    }
  }, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      const regex = /\/\*\s*devanagari\s*\*\/[\s\S]*?}/g;
      let match;
      while ((match = regex.exec(data)) !== null) {
        console.log(match[0]);
      }
      process.exit(0);
    });
  }).on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
}

run();
