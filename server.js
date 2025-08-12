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

// SQLite veritabanı bağlantısı
const connectDB = async () => {
  try {
    await testConnection();
    await syncDatabase();
    console.log('✅ SQLite veritabanı hazır');
    // Seed admin user if none exists
    const User = require('./models/User');
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
    const adminPin = process.env.SEED_ADMIN_PIN || '1234';
    const adminFullName = process.env.SEED_ADMIN_FULLNAME || 'System Admin';
    const existingCount = await User.count();
    const adminCount = await User.count({ where: { isAdmin: true } });
    if (existingCount === 0) {
      await User.create({
        username: adminUsername,
        pin: adminPin,
        fullName: adminFullName,
        phone: null,
        isAdmin: true,
      });
      console.log(`👤 İlk admin kullanıcısı oluşturuldu -> username: ${adminUsername}, pin: ${adminPin}`);
    } else if (adminCount === 0) {
      // No admin exists: try to create or promote
      const existingByUsername = await User.findOne({ where: { username: adminUsername } });
      if (!existingByUsername) {
        await User.create({
          username: adminUsername,
          pin: adminPin,
          fullName: adminFullName,
          phone: null,
          isAdmin: true,
        });
        console.log(`👤 Admin kullanıcısı eklendi -> username: ${adminUsername}, pin: ${adminPin}`);
      } else {
        existingByUsername.isAdmin = true;
        existingByUsername.pin = adminPin; // ensure known PIN
        await existingByUsername.save();
        console.log(`🛡️  Var olan kullanıcı admin yapıldı ve PIN güncellendi -> username: ${adminUsername}`);
      }
    }
  } catch (error) {
    console.error('❌ Veritabanı hatası:', error);
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
