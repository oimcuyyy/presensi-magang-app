const db = require('./src/config/db');
db.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@sekolah.com'")
  .then(() => {
    console.log('Role updated to admin');
    process.exit(0);
  })
  .catch(err => console.error(err));
