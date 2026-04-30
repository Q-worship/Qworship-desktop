const { app } = require('electron');

app.whenReady().then(() => {
  try {
    const Database = require('better-sqlite3');
    console.log('BETTER_SQLITE3_OK', typeof Database);
    app.quit();
  } catch (error) {
    console.error('BETTER_SQLITE3_ERR', error && error.stack ? error.stack : error);
    app.exit(1);
  }
});
