# Environment Setup Guide

## Important: Setting up Environment Variables

This project uses a **single `.env` file in the root directory** for both frontend and backend configuration. The actual `.env` file is **NOT** tracked in git for security reasons.

### First-time Setup

After cloning this repository, you need to create your own `.env` file:

```bash
# From the project root directory
copy .env.example .env
```

Then edit `.env` and update the following values:
- `DB_PASSWORD`: Your MySQL root password
- `JWT_SECRET`: A secure random string for JWT token generation (use a long random string)
- `EMAIL_USER` and `EMAIL_PASS`: Your email credentials (if using email notifications)

### How It Works

- **Backend**: Loads `.env` from the root directory using `dotenv` with a custom path
- **Frontend**: Loads `.env` from the root directory using Vite's `envDir` configuration
- **Frontend variables**: Must be prefixed with `VITE_` to be exposed to the client-side code

### What's Ignored

The following files/folders are ignored by git (see `.gitignore`):
- `node_modules/` - All npm packages
- `.env` - Environment variable file (root level)
- `*.log` - Log files
- Build outputs and temporary files

### Important Notes

⚠️ **Never commit your actual `.env` file to git!**
⚠️ The `.env.example` file contains template configurations with placeholder values.
⚠️ Always use the `.env.example` file as a reference when setting up new environments.
⚠️ Both frontend and backend share the same `.env` file in the project root.
