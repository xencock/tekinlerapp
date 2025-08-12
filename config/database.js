const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// SQLite veritabanı konfigürasyonu
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  benchmark: process.env.NODE_ENV === 'development',
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

// Veritabanı bağlantısını test et
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite veritabanına başarıyla bağlanıldı');

    // Apply SQLite performance PRAGMAs to improve concurrency and IO
    try {
      await sequelize.query('PRAGMA journal_mode = WAL;');
      await sequelize.query('PRAGMA synchronous = NORMAL;');
      await sequelize.query('PRAGMA temp_store = MEMORY;');
      await sequelize.query('PRAGMA cache_size = -20000;'); // ~20MB page cache
      console.log('SQLite PRAGMA ayarları uygulandı (WAL, synchronous=NORMAL, temp_store=MEMORY)');
    } catch (pragmaError) {
      console.warn('SQLite PRAGMA ayarları uygulanamadı:', pragmaError?.message || pragmaError);
    }
    return true;
  } catch (error) {
    console.error('SQLite bağlantı hatası:', error);
    return false;
  }
};

// SQLite şema uyumluluğunu garanti et (manuel migration benzeri)
const ensureSchema = async () => {
  try {
    const qi = sequelize.getQueryInterface();
    // Users tablosunda isAdmin sütunu yoksa ekle
    try {
      const usersDesc = await qi.describeTable('Users');
      if (usersDesc && !usersDesc.isAdmin) {
        await qi.addColumn('Users', 'isAdmin', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        console.log('Users tablosuna eksik olan isAdmin sütunu eklendi');
      }
    } catch (e) {
      // Table yoksa sync aşaması oluşturacaktır
    }

    // Performans için yardımcı indexler (idempotent şekilde)
    try {
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_customers_firstName ON customers(firstName)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_customers_lastName ON customers(lastName)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_customers_createdAt ON customers(createdAt)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_customers_isActive_createdAt ON customers(isActive, createdAt)');
      console.log('Müşteri indexleri kontrol edildi/oluşturuldu');
    } catch (indexError) {
      console.warn('Index oluşturma sırasında uyarı:', indexError?.message || indexError);
    }
  } catch (error) {
    console.error('Şema kontrolü/migrasyonu hatası:', error);
  }
};

// Veritabanını senkronize et
const syncDatabase = async () => {
  try {
    // Önce şemayı kontrol et, eksik sütunları ekle
    await ensureSchema();
    // Normal sync
    await sequelize.sync();
    console.log('Veritabanı tabloları senkronize edildi');

    // Opsiyonel optimizasyon: ANALYZE (env üzerinden aç/kapa)
    if ((process.env.DB_ANALYZE_ON_START || '').toLowerCase() === 'true') {
      try {
        await sequelize.query('ANALYZE');
        console.log('SQLite ANALYZE çalıştırıldı');
      } catch (analyzeError) {
        console.warn('ANALYZE başarısız:', analyzeError?.message || analyzeError);
      }
    }
  } catch (error) {
    console.error('Veritabanı senkronizasyon hatası:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
