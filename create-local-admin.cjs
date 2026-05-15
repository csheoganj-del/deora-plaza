#!/usr/bin/env node

/**
 * Create Local Admin User for DEORA Plaza
 * This script creates an admin user in the local SQLite database
 */

const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dev.db');

async function createAdminUser() {
  console.log('🚀 Creating admin user in local database...');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Connected to local SQLite database');
    });

    // Create users table if it doesn't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        businessUnit TEXT NOT NULL DEFAULT 'cafe',
        name TEXT NOT NULL,
        phoneNumber TEXT,
        permissions TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createUsersTable, async (err) => {
      if (err) {
        console.error('❌ Error creating users table:', err.message);
        reject(err);
        return;
      }

      try {
        // Hash the admin password
        const adminPassword = 'Admin@123!';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        // Admin user data
        const adminUser = {
          id: 'admin-' + Date.now(),
          username: 'admin',
          email: 'admin@deoraplaza.com',
          password: hashedPassword,
          role: 'super_admin',
          businessUnit: 'all',
          name: 'System Administrator',
          phoneNumber: '+91-9999999999',
          permissions: JSON.stringify([
            'view_dashboard', 'view_analytics', 'export_reports',
            'manage_business_units', 'manage_orders', 'manage_inventory',
            'manage_customers', 'manage_staff', 'view_kds', 'manage_kds',
            'create_bookings', 'manage_rooms', 'manage_events',
            'view_feedback', 'manage_feedback'
          ]),
          isActive: 1
        };

        // Check if admin user already exists
        db.get('SELECT id FROM users WHERE role = ? OR username = ?', ['super_admin', 'admin'], (err, row) => {
          if (err) {
            console.error('❌ Error checking existing admin:', err.message);
            reject(err);
            return;
          }

          if (row) {
            console.log('ℹ️ Admin user already exists');
            console.log('📧 Email: admin@deoraplaza.com');
            console.log('🔑 Password: Admin@123!');
            db.close();
            resolve();
            return;
          }

          // Insert admin user
          const insertQuery = `
            INSERT INTO users (id, username, email, password, role, businessUnit, name, phoneNumber, permissions, isActive)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(insertQuery, [
            adminUser.id,
            adminUser.username,
            adminUser.email,
            adminUser.password,
            adminUser.role,
            adminUser.businessUnit,
            adminUser.name,
            adminUser.phoneNumber,
            adminUser.permissions,
            adminUser.isActive
          ], function(err) {
            if (err) {
              console.error('❌ Error creating admin user:', err.message);
              reject(err);
              return;
            }

            console.log('✅ Admin user created successfully!');
            console.log('📧 Email: admin@deoraplaza.com');
            console.log('🔑 Password: Admin@123!');
            console.log('⚠️ Please change the password after first login!');
            
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err.message);
                reject(err);
              } else {
                console.log('✅ Database connection closed');
                resolve();
              }
            });
          });
        });
      } catch (error) {
        console.error('❌ Error hashing password:', error);
        reject(error);
      }
    });
  });
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n🎉 Admin user setup completed!');
    console.log('You can now start the server with: npm run dev');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to create admin user:', error);
    process.exit(1);
  });