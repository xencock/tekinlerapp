const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// SQLite veritabanı konfigürasyonu
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
  } catch (error) {
    console.error('Veritabanı senkronizasyon hatası:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
