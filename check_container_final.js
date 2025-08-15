const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyasının yolu
const dbPath = path.join(__dirname, 'database_container_check.sqlite');

// Veritabanına bağlan
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanılamadı:', err.message);
        process.exit(1);
    }
    console.log('Container veritabanına bağlanıldı');
});

// Admin kullanıcısını kontrol et
db.get("SELECT * FROM Users WHERE username = 'TekinlerAdmin'", [], (err, user) => {
    if (err) {
        console.error('Sorgu hatası:', err.message);
        process.exit(1);
    }
    
    if (!user) {
        console.log('❌ TekinlerAdmin kullanıcısı bulunamadı!');
        process.exit(1);
    }
    
    console.log('\n=== CONTAINER VERİTABANINDAKİ ADMIN KULLANICISI ===');
    console.log(`ID: ${user.id}`);
    console.log(`Kullanıcı Adı: ${user.username}`);
    console.log(`Tam Ad: ${user.fullName}`);
    console.log(`Admin (isAdmin): ${user.isAdmin} (${typeof user.isAdmin})`);
    console.log(`Aktif (isActive): ${user.isActive} (${typeof user.isActive})`);
    console.log(`Giriş Denemeleri: ${user.loginAttempts}`);
    console.log(`Kilit Tarihi: ${user.lockUntil || 'YOK'}`);
    console.log(`Son Güncelleme: ${user.updatedAt}`);
    
    // Veritabanı bağlantısını kapat
    db.close((err) => {
        if (err) {
            console.error('Veritabanı kapatılamadı:', err.message);
        }
        console.log('\nVeritabanı bağlantısı kapatıldı');
        process.exit(0);
    });
});
