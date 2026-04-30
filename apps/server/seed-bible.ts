import { connectDB } from "./src/core/db.js";
import { BibleImportService } from "./src/modules/bible/bible-import.service.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const legacyDir = "/Users/rebeccashewuri/Documents/development/qworship/QWorship";

const files = [
  { path: `${legacyDir}/kjv-complete.json`, version: 'kjv' },
  { path: `${legacyDir}/nkjv-complete.json`, version: 'nkjv' },
  { path: `${legacyDir}/amp-complete.json`, version: 'amp' },
  { path: `${legacyDir}/msg-complete.json`, version: 'msg' },
  { path: `${legacyDir}/esv-complete.json`, version: 'esv' },
  { path: `${legacyDir}/niv-complete.json`, version: 'niv' },
  { path: `${legacyDir}/gn-complete.json`, version: 'gn' },
];

async function seed() {
  console.log("Connecting to DB...");
  await connectDB();
  console.log("Connected.");

  for (const file of files) {
    if (fs.existsSync(file.path)) {
      await BibleImportService.importBibleJSON(file.path, file.version);
    } else {
      console.log(`File not found: ${file.path}`);
    }
  }
  
  await mongoose.disconnect();
  console.log("Seeding Database Complete.");
}

seed().catch(console.error);
