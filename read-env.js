
const fs = require('fs');
try {
    const data = fs.readFileSync('.env', 'utf8');
    console.log(data);
} catch (err) {
    console.error(err);
}
