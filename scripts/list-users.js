const { testConnection, syncDatabase } = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    await testConnection();
    await syncDatabase();
    const users = await User.findAll({
      attributes: ['id', 'username', 'isAdmin', 'fullName', 'createdAt', 'lastLogin']
    });
    console.log('Users:');
    for (const u of users) {
      const j = u.toJSON();
      console.log(`- id=${j.id} username=${j.username} isAdmin=${j.isAdmin} fullName=${j.fullName}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to list users:', err);
    process.exit(1);
  }
})();


