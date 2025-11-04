const fs = require("fs")

if (!fs.existsSync(".contentlayer")) {
  console.error("❌ Missing .contentlayer. Run: npm run contentlayer:build")
  process.exit(1)
}
