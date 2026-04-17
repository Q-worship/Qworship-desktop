const Database = require('better-sqlite3');
const db = new Database('dist/mac/Qworship Desktop.app/Contents/Resources/app.asar.unpacked/dist/data/bibles/bible.db', { readonly: true });
console.log(db.prepare("SELECT * FROM verses LIMIT 1").get());
console.log(db.prepare("SELECT * FROM verses WHERE book = 'John' LIMIT 1").get());
