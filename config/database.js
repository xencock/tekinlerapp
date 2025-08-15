const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config(); // Ortam değişkenlerini yüklemek için

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Production ortamı için PostgreSQL konfigürasyonu
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false, // Production'da detaylı loglamayı kapat
    benchmark: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Hosting sağlayıcınıza göre bu ayar değişebilir
      }
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else {
  // Development ortamı için SQLite konfigürasyonu
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: console.log,
    benchmark: true,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
}

// Veritabanı bağlantısını test et
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Veritabanına (${sequelize.getDialect()}) başarıyla bağlanıldı`);

    // SQLite'a özel performans ayarları
    if (sequelize.getDialect() === 'sqlite') {
      try {
        await sequelize.query('PRAGMA journal_mode = WAL;');
        await sequelize.query('PRAGMA synchronous = NORMAL;');
        await sequelize.query('PRAGMA temp_store = MEMORY;');
        await sequelize.query('PRAGMA cache_size = -20000;'); // ~20MB page cache
        console.log('SQLite PRAGMA ayarları uygulandı');
      } catch (pragmaError) {
        console.warn('SQLite PRAGMA ayarları uygulanamadı:', pragmaError?.message || pragmaError);
      }
    }
    return true;
  } catch (error) {
    console.error(`Veritabanı (${sequelize.getDialect()}) bağlantı hatası:`, error);
    return false;
  }
};

// SQLite şema uyumluluğunu garanti et (manuel migration benzeri)
// NOT: Bu yöntem production için önerilmez. Production'da Umzug gibi migration kütüphaneleri kullanılmalıdır.
const ensureSchema = async () => {
  if (sequelize.getDialect() !== 'sqlite') {
    console.log('PostgreSQL için manuel şema kontrolü atlandı. Lütfen migration kullanın.');
    return;
  }
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

    // Performans için yardımcı indexler
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
    // Geliştirme ortamında şemayı kontrol et
    if (process.env.NODE_ENV !== 'production') {
      await ensureSchema();
    }
    
    // Production'da sync() kullanmak veri kaybına yol açabilir. Dikkatli kullanılmalıdır.
    // Genellikle sadece geliştirme ortamında kullanılır.
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('Veritabanı tabloları senkronize edildi');

  } catch (error) {
    console.error('Veritabanı senkronizasyon hatası:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
