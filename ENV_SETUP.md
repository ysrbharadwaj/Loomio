# Environment Setup Guide

## Important: Setting up Environment Variables

This project uses environment variables for configuration. The actual `.env` files are **NOT** tracked in git for security reasons.

### First-time Setup

After cloning this repository, you need to create your own `.env` files:

#### 1. Backend Environment Setup

```bash
cd backend
copy .env.example .env
```

Then edit `backend/.env` and update the following values:
- `DB_PASSWORD`: Your MySQL root password
- `JWT_SECRET`: A secure random string for JWT token generation
- `EMAIL_USER` and `EMAIL_PASS`: Your email credentials (if using email notifications)

#### 2. Frontend Environment Setup

```bash
cd frontend
copy .env.example .env
```

The default configuration should work if your backend is running on port 5000.

### What's Ignored

The following files/folders are ignored by git (see `.gitignore`):
- `node_modules/` - All npm packages
- `.env` - Environment variable files
- `*.log` - Log files
- Build outputs and temporary files

### Important Notes

⚠️ **Never commit your actual `.env` files to git!**
⚠️ The `.env.example` files contain template configurations with placeholder values.
⚠️ Always use the `.env.example` files as a reference when setting up new environments.
