const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);

// safeParse helper
function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch {
    return [val];
  }
}

async function run() {
  try {
    const [products] = await sequelize.query("SELECT id, name, category, tag, short_description FROM products");
    const q = "tin";
    console.log(`Searching for "${q}"...`);

    for (const p of products) {
      const name = p.name || "";
      const shortDesc = p.short_description || "";
      const categories = safeParse(p.category, []);
      const tags = safeParse(p.tag, []);

      const nameMatch = name.toLowerCase().includes(q);
      const descMatch = shortDesc.toLowerCase().includes(q);
      const catMatch = categories.some(c => c.toLowerCase().includes(q));
      const tagMatch = tags.some(t => t.toLowerCase().includes(q));

      if (nameMatch || descMatch || catMatch || tagMatch) {
        console.log(`Product "${name}" matched:`);
        if (nameMatch) console.log(`  - Name matched: "${name}"`);
        if (descMatch) console.log(`  - Short Description matched: "${shortDesc}"`);
        if (catMatch) console.log(`  - Category matched:`, categories);
        if (tagMatch) console.log(`  - Tag matched:`, tags.filter(t => t.toLowerCase().includes(q)));
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

run();
