const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyasının yolu
const dbPath = path.join(__dirname, 'database.sqlite');

// Veritabanına bağlan
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanılamadı:', err.message);
        process.exit(1);
    }
    console.log('Ana veritabanına bağlanıldı');
});

// Admin kullanıcısını aktif hale getir
const updateQuery = `
    UPDATE Users 
    SET isActive = 1, 
        isAdmin = 1, 
        loginAttempts = 0, 
        lockUntil = NULL,
        updatedAt = datetime('now')
    WHERE username = 'TekinlerAdmin'
`;

db.run(updateQuery, [], function(err) {
    if (err) {
        console.error('Güncelleme hatası:', err.message);
        process.exit(1);
    }
    
    console.log(`✅ Admin kullanıcısı güncellendi! Etkilenen satır sayısı: ${this.changes}`);
    
    // Güncellenmiş kullanıcıyı kontrol et
    db.get("SELECT * FROM Users WHERE username = 'TekinlerAdmin'", [], (err, user) => {
        if (err) {
            console.error('Kontrol hatası:', err.message);
            process.exit(1);
        }
        
        if (!user) {
            console.log('❌ TekinlerAdmin kullanıcısı bulunamadı!');
            process.exit(1);
        }
        
        console.log('\n=== GÜNCELLENMİŞ ADMIN KULLANICISI ===');
        console.log(`ID: ${user.id}`);
        console.log(`Kullanıcı Adı: ${user.username}`);
        console.log(`Tam Ad: ${user.fullName}`);
        console.log(`Admin: ${user.isAdmin ? '✅ EVET' : '❌ HAYIR'}`);
        console.log(`Aktif: ${user.isActive ? '✅ EVET' : '❌ HAYIR'}`);
        console.log(`Giriş Denemeleri: ${user.loginAttempts}`);
        console.log(`Kilit Tarihi: ${user.lockUntil || 'YOK'}`);
        console.log(`Son Güncelleme: ${user.updatedAt}`);
        
        // Veritabanı bağlantısını kapat
        db.close((err) => {
            if (err) {
                console.error('Veritabanı kapatılamadı:', err.message);
            }
            console.log('\nVeritabanı bağlantısı kapatıldı');
            console.log('\n🎯 Şimdi backend container\'ını yeniden başlatın!');
            process.exit(0);
        });
    });
});
