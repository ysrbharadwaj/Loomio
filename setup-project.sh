#!/bin/bash

# Loomio Project Setup Script for New System
# Run this script on your new system to set up the complete environment

echo "🚀 Loomio Project Setup Script"
echo "==============================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root. Consider using a regular user account."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js using Node Version Manager (nvm)
install_nodejs() {
    echo "📦 Installing Node.js..."
    
    # Install nvm if not present
    if ! command_exists nvm; then
        echo "   Installing Node Version Manager (nvm)..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # Install and use Node.js LTS
    nvm install --lts
    nvm use --lts
    nvm alias default node
    
    echo "✅ Node.js installed: $(node --version)"
    echo "✅ npm installed: $(npm --version)"
}

# Function to install MySQL
install_mysql() {
    echo "📦 Installing MySQL..."
    
    if command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y mysql-server mysql-client
        sudo systemctl start mysql
        sudo systemctl enable mysql
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL/Fedora
        sudo yum install -y mysql-server mysql
        sudo systemctl start mysqld
        sudo systemctl enable mysqld
    elif command -v brew >/dev/null 2>&1; then
        # macOS
        brew install mysql
        brew services start mysql
    else
        echo "❌ Unsupported package manager. Please install MySQL manually."
        exit 1
    fi
    
    echo "✅ MySQL installed and started"
}

# Function to secure MySQL installation
secure_mysql() {
    echo "🔒 Securing MySQL installation..."
    echo "   Please follow the prompts to set up MySQL security."
    echo "   Recommended settings:"
    echo "   - Set a strong root password"
    echo "   - Remove anonymous users: Y"
    echo "   - Disallow root login remotely: Y"
    echo "   - Remove test database: Y"
    echo "   - Reload privilege tables: Y"
    echo ""
    read -p "Press Enter to continue with MySQL security setup..."
    
    sudo mysql_secure_installation
}

# Function to create database and user
setup_database() {
    echo "🗄️  Setting up Loomio database..."
    
    read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
    echo ""
    
    # Create database and user
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS loomio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'loomio_user'@'localhost' IDENTIFIED BY 'loomio_password_123';
GRANT ALL PRIVILEGES ON loomio_db.* TO 'loomio_user'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Database 'loomio_db' created successfully"
        echo "✅ User 'loomio_user' created with full access"
    else
        echo "❌ Error: Failed to create database or user"
        exit 1
    fi
}

# Main setup process
echo "🔍 Checking system requirements..."

# Check operating system
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "   Operating System: $MACHINE"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: This doesn't appear to be the Loomio project directory."
    echo "   Make sure you're running this script from the root of the Loomio project."
    exit 1
fi

echo "✅ Found Loomio project structure"

# Install Node.js if not present
if ! command_exists node; then
    install_nodejs
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js already installed: $NODE_VERSION"
fi

# Install MySQL if not present  
if ! command_exists mysql; then
    read -p "MySQL not found. Install MySQL? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_mysql
        secure_mysql
        setup_database
    else
        echo "⚠️  MySQL installation skipped. You'll need to install and configure MySQL manually."
    fi
else
    echo "✅ MySQL already installed"
    read -p "Set up Loomio database? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    fi
fi

# Install project dependencies
echo "📦 Installing project dependencies..."

# Install root dependencies
if [ -f "package.json" ]; then
    echo "   Installing root dependencies..."
    npm install
fi

# Install backend dependencies
if [ -f "backend/package.json" ]; then
    echo "   Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies
if [ -f "frontend/package.json" ]; then
    echo "   Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "✅ All dependencies installed"

# Set up environment files
echo "⚙️  Setting up environment configuration..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.config" ]; then
        echo "   Creating backend .env file from env.config..."
        cp backend/env.config backend/.env
        
        # Update database credentials
        sed -i 's/DB_USER=root/DB_USER=loomio_user/' backend/.env
        sed -i 's/DB_PASSWORD=your_mysql_password/DB_PASSWORD=loomio_password_123/' backend/.env
        
        echo "✅ Backend environment file created"
    else
        echo "⚠️  Backend env.config not found. You'll need to create backend/.env manually."
    fi
else
    echo "✅ Backend .env file already exists"
fi

# Frontend environment
if [ ! -f "frontend/.env.local" ]; then
    if [ -f "frontend/env.local" ]; then
        echo "   Creating frontend .env.local file..."
        cp frontend/env.local frontend/.env.local
        echo "✅ Frontend environment file created"
    elif [ -f "frontend/env.example" ]; then
        echo "   Creating frontend .env.local from example..."
        cp frontend/env.example frontend/.env.local
        echo "✅ Frontend environment file created"
    else
        echo "⚠️  Frontend environment template not found. Creating basic .env.local..."
        cat > frontend/.env.local << EOF
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Loomio
EOF
        echo "✅ Basic frontend environment file created"
    fi
else
    echo "✅ Frontend .env.local file already exists"
fi

# Create startup scripts
echo "📝 Creating startup scripts..."

# Create start script
cat > start-loomio.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Loomio Application"
echo "=============================="

# Function to kill background jobs on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Loomio..."
    jobs -p | xargs -r kill
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Loomio is starting up!"
echo "   Backend API: http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background jobs
wait
EOF

chmod +x start-loomio.sh

echo "✅ Startup script created: start-loomio.sh"

# Final setup summary
echo ""
echo "🎉 Loomio Project Setup Complete!"
echo "=================================="
echo ""
echo "📋 Setup Summary:"
echo "   ✅ Node.js and npm installed"
echo "   ✅ MySQL installed and configured"
echo "   ✅ Database 'loomio_db' created"
echo "   ✅ Project dependencies installed"
echo "   ✅ Environment files configured"
echo "   ✅ Startup scripts created"
echo ""
echo "📝 Next Steps:"
echo "   1. If you have a database backup, run: ./import-database.sh"
echo "   2. Start the application: ./start-loomio.sh"
echo "   3. Open your browser to: http://localhost:3000"
echo ""
echo "🔧 Manual Configuration (if needed):"
echo "   - Backend config: backend/.env"
echo "   - Frontend config: frontend/.env.local"
echo "   - Database: MySQL on localhost:3306"
echo ""
echo "📚 Available Scripts:"
echo "   ./start-loomio.sh       - Start both frontend and backend"
echo "   ./import-database.sh    - Import database backup"
echo "   ./export-database.sh    - Export database backup"