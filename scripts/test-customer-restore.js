const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Test script for customer restore functionality
async function testCustomerRestore() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🧪 Müşteri Geri Yükleme Sistemi Test Ediliyor...\n');
  
  try {
    // 1. Mevcut silinen müşterileri listele
    console.log('1️⃣ Mevcut silinen müşteriler:');
    const deletedCustomers = await new Promise((resolve, reject) => {
      db.all('SELECT id, firstName, lastName, phone, email, tcNumber, isActive FROM customers WHERE isActive = 0 LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (deletedCustomers.length === 0) {
      console.log('   ❌ Silinen müşteri bulunamadı');
      return;
    }
    
    deletedCustomers.forEach(customer => {
      console.log(`   📋 ID: ${customer.id}, Ad: ${customer.firstName} ${customer.lastName}, Telefon: ${customer.phone || 'Yok'}`);
    });
    
    // 2. Test müşterisi ekle
    console.log('\n2️⃣ Test müşterisi ekleniyor...');
    const testCustomer = {
      firstName: 'Test',
      lastName: 'Müşteri',
      phone: '5559998888',
      email: 'test@example.com',
      tcNumber: '12345678901'
    };
    
    const insertResult = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO customers (
          firstName, lastName, phone, email, tcNumber, 
          address, city, district, postalCode, 
          preferredColors, preferredBrands, smsPermission, emailPermission, 
          notes, createdBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        testCustomer.firstName, testCustomer.lastName, testCustomer.phone, 
        testCustomer.email, testCustomer.tcNumber, 'Test Adres', 'İstanbul', 
        'Kadıköy', '34700', '[]', '[]', 1, 1, 'Test müşteri', 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    console.log(`   ✅ Test müşterisi eklendi (ID: ${insertResult})`);
    
    // 3. Test müşterisini sil (soft delete)
    console.log('\n3️⃣ Test müşterisi siliniyor (soft delete)...');
    await new Promise((resolve, reject) => {
      db.run('UPDATE customers SET isActive = 0, updatedBy = 1 WHERE id = ?', [insertResult], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('   ✅ Test müşterisi silindi');
    
    // 4. Aynı bilgilerle yeni müşteri eklemeye çalış
    console.log('\n4️⃣ Aynı bilgilerle yeni müşteri eklenmeye çalışılıyor...');
    try {
      const duplicateResult = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO customers (
            firstName, lastName, phone, email, tcNumber, 
            address, city, district, postalCode, 
            preferredColors, preferredBrands, smsPermission, emailPermission, 
            notes, createdBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          'Yeni', 'Müşteri', testCustomer.phone, 
          testCustomer.email, testCustomer.tcNumber, 'Yeni Adres', 'Ankara', 
          'Çankaya', '06100', '[]', '[]', 1, 1, 'Yeni test müşteri', 1
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      console.log(`   ✅ Yeni müşteri eklendi (ID: ${duplicateResult})`);
      
      // Yeni eklenen müşteriyi de silelim
      await new Promise((resolve, reject) => {
        db.run('UPDATE customers SET isActive = 0, updatedBy = 1 WHERE id = ?', [duplicateResult], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('   ❌ UNIQUE constraint hatası - sistem hala eski şekilde çalışıyor');
      } else {
        console.log(`   ❌ Beklenmeyen hata: ${error.message}`);
      }
    }
    
    // 5. Test müşterisini geri yükle
    console.log('\n5️⃣ Test müşterisi geri yükleniyor...');
    await new Promise((resolve, reject) => {
      db.run('UPDATE customers SET isActive = 1, updatedBy = 1 WHERE id = ?', [insertResult], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('   ✅ Test müşterisi geri yüklendi');
    
    // 6. Aynı bilgilerle tekrar müşteri eklemeye çalış (bu sefer hata vermeli)
    console.log('\n6️⃣ Geri yüklenen müşteri aktifken aynı bilgilerle yeni müşteri eklenmeye çalışılıyor...');
    try {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO customers (
            firstName, lastName, phone, email, tcNumber, 
            address, city, district, postalCode, 
            preferredColors, preferredBrands, smsPermission, emailPermission, 
            notes, createdBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          'Çakışan', 'Müşteri', testCustomer.phone, 
          testCustomer.email, testCustomer.tcNumber, 'Çakışan Adres', 'İzmir', 
          'Konak', '35000', '[]', '[]', 1, 1, 'Çakışan test müşteri', 1
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      console.log('   ❌ Müşteri eklendi - partial unique index çalışmıyor');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('   ✅ UNIQUE constraint hatası - partial unique index çalışıyor');
      } else {
        console.log(`   ❌ Beklenmeyen hata: ${error.message}`);
      }
    }
    
    // 7. Test verilerini temizle
    console.log('\n7️⃣ Test verileri temizleniyor...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM customers WHERE id = ?', [insertResult], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('   ✅ Test verileri temizlendi');
    
    console.log('\n🎉 Test tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    db.close();
  }
}

// Test'i çalıştır
testCustomerRestore();
