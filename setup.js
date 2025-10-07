const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Loomio Setup Wizard');
console.log('=====================\n');

const questions = [
  {
    key: 'DB_HOST',
    question: 'MySQL Host (default: localhost): ',
    default: 'localhost'
  },
  {
    key: 'DB_PORT',
    question: 'MySQL Port (default: 3306): ',
    default: '3306'
  },
  {
    key: 'DB_USER',
    question: 'MySQL Username (default: root): ',
    default: 'root'
  },
  {
    key: 'DB_PASSWORD',
    question: 'MySQL Password: ',
    required: true
  },
  {
    key: 'JWT_SECRET',
    question: 'JWT Secret (leave empty for auto-generated): ',
    generate: () => require('crypto').randomBytes(64).toString('hex')
  }
];

let answers = {};

const askQuestion = (index) => {
  if (index >= questions.length) {
    createEnvFiles();
    return;
  }

  const q = questions[index];
  rl.question(q.question, (answer) => {
    if (q.required && !answer.trim()) {
      console.log('❌ This field is required!');
      askQuestion(index);
      return;
    }

    if (answer.trim() === '' && q.default) {
      answers[q.key] = q.default;
    } else if (answer.trim() === '' && q.generate) {
      answers[q.key] = q.generate();
    } else {
      answers[q.key] = answer.trim();
    }

    askQuestion(index + 1);
  });
};

const createEnvFiles = () => {
  console.log('\n📝 Creating environment files...');

  // Backend .env
  const backendEnv = `# Database Configuration
DB_HOST=${answers.DB_HOST}
DB_PORT=${answers.DB_PORT}
DB_NAME=loomio_db
DB_USER=${answers.DB_USER}
DB_PASSWORD=${answers.DB_PASSWORD}

# JWT Configuration
JWT_SECRET=${answers.JWT_SECRET}
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000`;

  // Frontend .env
  const frontendEnv = `VITE_API_URL=http://localhost:5000/api`;

  try {
    fs.writeFileSync(path.join(__dirname, 'backend', '.env'), backendEnv);
    fs.writeFileSync(path.join(__dirname, 'frontend', '.env'), frontendEnv);
    
    console.log('✅ Environment files created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Create database: CREATE DATABASE loomio_db;');
    console.log('3. Start the servers:');
    console.log('   - Windows: start-dev.bat');
    console.log('   - Linux/Mac: ./start-dev.sh');
    console.log('   - Manual: npm run dev:backend (terminal 1), npm run dev:frontend (terminal 2)');
    console.log('\n🌐 Access the application at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error creating environment files:', error.message);
  }

  rl.close();
};

// Start the setup
askQuestion(0);
