#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Backup dizinini oluştur
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Veritabanı integrity check
const checkIntegrity = () => {
  try {
    console.log('🔍 Veritabanı integrity kontrolü yapılıyor...');
    const result = execSync(`sqlite3 "${DB_PATH}" "PRAGMA integrity_check;"`, { encoding: 'utf8' });
    
    if (result.trim() === 'ok') {
      console.log('✅ Veritabanı integrity check başarılı');
      return true;
    } else {
      console.error('❌ Veritabanı integrity check başarısız:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Integrity check hatası:', error.message);
    return false;
  }
};

// Veritabanı backup
const createBackup = () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `database_${timestamp}.sqlite`);
    
    console.log('💾 Veritabanı backup oluşturuluyor...');
    execSync(`cp "${DB_PATH}" "${backupPath}"`);
    
    // Backup dosyasının integrity'sini kontrol et
    const backupIntegrity = execSync(`sqlite3 "${backupPath}" "PRAGMA integrity_check;"`, { encoding: 'utf8' });
    
    if (backupIntegrity.trim() === 'ok') {
      console.log(`✅ Backup başarılı: ${backupPath}`);
      
      // Eski backup'ları temizle (7 günden eski)
      cleanupOldBackups();
      
      return backupPath;
    } else {
      console.error('❌ Backup integrity check başarısız');
      fs.unlinkSync(backupPath);
      return null;
    }
  } catch (error) {
    console.error('❌ Backup hatası:', error.message);
    return null;
  }
};

// Eski backup'ları temizle
const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const sevenDaysAgo = 7 * 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      if (file.endsWith('.sqlite')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > sevenDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Eski backup silindi: ${file}`);
        }
      }
    });
  } catch (error) {
    console.warn('⚠️  Eski backup temizleme hatası:', error.message);
  }
};

// WAL dosyalarını temizle
const cleanupWAL = () => {
  try {
    const walPath = DB_PATH + '-wal';
    const shmPath = DB_PATH + '-shm';
    
    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath);
      console.log('🗑️  WAL dosyası temizlendi');
    }
    
    if (fs.existsSync(shmPath)) {
      fs.unlinkSync(shmPath);
      console.log('🗑️  SHM dosyası temizlendi');
    }
  } catch (error) {
    console.warn('⚠️  WAL temizleme hatası:', error.message);
  }
};

// Ana fonksiyon
const main = () => {
  console.log('🚀 Veritabanı bakım işlemi başlatılıyor...\n');
  
  // Integrity check
  if (!checkIntegrity()) {
    console.error('❌ Veritabanı bozuk! Backup oluşturulamaz.');
    process.exit(1);
  }
  
  // WAL dosyalarını temizle
  cleanupWAL();
  
  // Backup oluştur
  const backupPath = createBackup();
  
  if (backupPath) {
    console.log('\n✅ Veritabanı bakım işlemi tamamlandı!');
    console.log(`📁 Backup konumu: ${backupPath}`);
  } else {
    console.error('\n❌ Backup oluşturulamadı!');
    process.exit(1);
  }
};

// Script direkt çalıştırılıyorsa main'i çağır
if (require.main === module) {
  main();
}

module.exports = {
  checkIntegrity,
  createBackup,
  cleanupWAL,
  cleanupOldBackups
};
