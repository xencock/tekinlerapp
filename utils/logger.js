const fs = require('fs');
const path = require('path');

/**
 * Simple Logger Utility
 * Logs to console and files based on environment
 */
class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.appLogPath = path.join(this.logsDir, 'app', 'app.log');
    this.errorLogPath = path.join(this.logsDir, 'error', 'error.log');
    
    // Ensure log directories exist
    this.ensureLogDirectories();
  }

  ensureLogDirectories() {
    const dirs = [
      path.join(this.logsDir, 'app'),
      path.join(this.logsDir, 'error')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(`ℹ️  ${formattedMessage}`);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(this.appLogPath, formattedMessage);
    }
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? { 
      ...meta, 
      error: error.message, 
      stack: error.stack 
    } : meta;
    
    const formattedMessage = this.formatMessage('error', message, errorMeta);
    console.error(`❌ ${formattedMessage}`);
    
    // Always write errors to file
    this.writeToFile(this.errorLogPath, formattedMessage);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(`⚠️  ${formattedMessage}`);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(this.appLogPath, formattedMessage);
    }
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.log(`🔍 ${formattedMessage}`);
    }
  }

  success(message, meta = {}) {
    const formattedMessage = this.formatMessage('success', message, meta);
    console.log(`✅ ${formattedMessage}`);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(this.appLogPath, formattedMessage);
    }
  }
}

module.exports = new Logger();
