const bcrypt = require('bcrypt');

// Test password hash generation
const password = 'password123';
const hash = bcrypt.hashSync(password, 10);
console.log('Generated hash:', hash);

// Test verification
const isValid = bcrypt.compareSync(password, hash);
console.log('Password verification:', isValid);

// Now test with actual database hash (we need to get it from database)
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'bible.db'));

const member = db.prepare('SELECT email, password_hash FROM users WHERE email = ?').get('member@example.com');
console.log('\nMember from DB:', member.email);
console.log('Stored hash:', member.password_hash);

const isValidDb = bcrypt.compareSync(password, member.password_hash);
console.log('Password verification with DB hash:', isValidDb);

db.close();