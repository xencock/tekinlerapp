/**
 * Simplified Customer Model for testing
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

class SimpleCustomer {
  static async findByPhone(phone) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.get('SELECT * FROM customers WHERE phone = ? AND isActive = 1', [phone], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
  
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.get('SELECT * FROM customers WHERE email = ? AND isActive = 1', [email], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
  
  static async findByTC(tcNumber) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.get('SELECT * FROM customers WHERE tcNumber = ? AND isActive = 1', [tcNumber], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
  
  static async create(customerData) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO customers (
          firstName, lastName, phone, email, tcNumber,
          address, city, district, postalCode,
          preferredColors, preferredBrands, smsPermission, emailPermission, notes, createdBy,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        customerData.firstName,
        customerData.lastName,
        customerData.phone || null,
        customerData.email || null,
        customerData.tcNumber || null,
        customerData.address || null,
        customerData.city || null,
        customerData.district || null,
        customerData.postalCode || null,
        JSON.stringify(customerData.preferredColors || []),
        JSON.stringify(customerData.preferredBrands || []),
        customerData.smsPermission !== false ? 1 : 0,
        customerData.emailPermission !== false ? 1 : 0,
        customerData.notes || null,
        customerData.createdBy || null,
        now,
        now
      ], function(err) {
        if (err) {
          stmt.finalize();
          db.close();
          reject(err);
        } else {
          // Get the created customer
          db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (err, row) => {
            stmt.finalize();
            db.close();
            if (err) {
              reject(err);
            } else {
              // Add helper methods
              row.getFullName = () => `${row.firstName} ${row.lastName}`;
              row.getBalanceStatus = () => {
                if (row.balance > 0) return 'Alacak';
                if (row.balance < 0) return 'Borç';
                return 'Sıfır';
              };
              row.getBalanceColor = () => {
                if (row.balance > 0) return 'text-green-600';
                if (row.balance < 0) return 'text-red-600';
                return 'text-gray-600';
              };
              resolve(row);
            }
          });
        }
      });
    });
  }
}

module.exports = SimpleCustomer;
