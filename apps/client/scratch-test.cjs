const Database = require('better-sqlite3');
try {
  const db = new Database('dist/mac/Qworship Desktop.app/Contents/Resources/app.asar.unpacked/dist/data/bibles/bible.db', { readonly: true });
  console.log("DB Loaded:", db.prepare("SELECT count(*) FROM verses").get());
  console.log("John:", db.prepare("SELECT count(*) FROM verses WHERE book = 'John'").get());
} catch (e) {
  console.error("DB Error:", e);
}
