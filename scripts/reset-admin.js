const { testConnection, syncDatabase } = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    await testConnection();
    await syncDatabase();

    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'TekinlerAdmin';
    const adminPin = process.env.SEED_ADMIN_PIN || '582765';
    const adminFullName = process.env.SEED_ADMIN_FULLNAME || 'Tekinler Admin';

    const desired = await User.findOne({ where: { username: adminUsername } });
    if (desired) {
      await desired.update({ isAdmin: true, isActive: true, pin: adminPin, fullName: desired.fullName || adminFullName });
      console.log(`[reset-admin] Ensured admin -> username: ${adminUsername}`);
    } else {
      await User.create({ username: adminUsername, pin: adminPin, fullName: adminFullName, phone: null, isAdmin: true, isActive: true });
      console.log(`[reset-admin] Created admin -> username: ${adminUsername}`);
    }

    // Deactivate legacy 'admin' user to prevent login with old creds
    if (adminUsername !== 'admin') {
      const legacy = await User.findOne({ where: { username: 'admin' } });
      if (legacy) {
        const randomPin = String(Math.floor(100000 + Math.random() * 900000));
        await legacy.update({ isActive: false, pin: randomPin });
        console.log('[reset-admin] Deactivated legacy user "admin"');
      }
    }
    console.log('[reset-admin] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[reset-admin] Failed:', err);
    process.exit(1);
  }
})();


