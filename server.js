const express = require('express');
const path = require('path');
const { testConnection, syncDatabase } = require('./config/database');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const salesRoutes = require('./routes/sales');
const categoryRoutes = require('./routes/categories');
const balanceRoutes = require('./routes/balance');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
// Reduce logging overhead in production; more concise in development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Load models to ensure they are registered with Sequelize before sync
require('./models/BalanceTransaction');
require('./models/Category');
require('./models/Customer');
require('./models/Invoice');
require('./models/Product');
require('./models/Sale');
require('./models/SaleItem');
require('./models/SimpleCustomer');
require('./models/StockMovement');
require('./models/User');

// SQLite veritabanı bağlantısı
const connectDB = async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('✅ SQLite veritabanı hazır');
    // Seed/ensure admin user with ENV-configured credentials
    const User = require('./models/User'); // Re-require User model after sync to ensure it's up-to-date
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'TekinlerAdmin';
    const adminPin = process.env.SEED_ADMIN_PIN || '582765';
    const adminFullName = process.env.SEED_ADMIN_FULLNAME || 'Tekinler Admin';
    const existingCount = await User.count();

    // 1) Eğer hiç kullanıcı yoksa, doğrudan oluştur
    if (existingCount === 0) {
      await User.create({ username: adminUsername, pin: adminPin, fullName: adminFullName, phone: null, isAdmin: true });
      console.log(` İlk admin kullanıcısı oluşturuldu -> username: ${adminUsername}`);
    } else {
      // 2) ENV'deki kullanıcı adını ara
      let envAdmin = await User.findOne({ where: { username: adminUsername } });
      if (envAdmin) {
        envAdmin.isAdmin = true;
        envAdmin.pin = adminPin;
        if (!envAdmin.fullName) envAdmin.fullName = adminFullName;
        await envAdmin.save();
        console.log(`  ENV admin kullanıcısı güncellendi -> username: ${adminUsername}`);
      } else {
        // 3) Başka bir admin varsa onu ENV kullanıcı adına taşı veya yeni admin oluştur
        const anyAdmin = await User.findOne({ where: { isAdmin: true } });
        if (anyAdmin) {
          // Eğer kullanıcı adı farklıysa güncelle
          anyAdmin.username = adminUsername;
          anyAdmin.pin = adminPin;
          anyAdmin.fullName = anyAdmin.fullName || adminFullName;
          anyAdmin.isAdmin = true;
          await anyAdmin.save();
          console.log(`🔁 Admin hesabı ENV değerlerine uyarlandı -> username: ${adminUsername}`);
        } else {
          await User.create({ username: adminUsername, pin: adminPin, fullName: adminFullName, phone: null, isAdmin: true });
          console.log(` Admin kullanıcısı eklendi -> username: ${adminUsername}`);
        }
      }
    }
  } catch (error) {
    console.error(' Veritabanı hatası:', error);
    process.exit(1);
  }
};

// Veritabanına bağlan
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/balance', balanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Tekinler API çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Sunucu hatası',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// Production: serve frontend build statically and SPA fallback
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'frontend', 'build');
  app.use(express.static(clientBuildPath));

  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// 404 handler for unknown API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`📱 API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});
