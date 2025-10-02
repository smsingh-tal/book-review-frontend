# Amazon Linux 2023 Frontend Environment Setup Script

This script sets up Node.js, nvm, build tools, and your frontend project for Vite/React/TypeScript on an EC2 instance running Amazon Linux 2023.

Save as `setup_frontend_env.sh` and run:
```
chmod +x setup_frontend_env.sh
./setup_frontend_env.sh
```

---

```sh
#!/bin/bash

# Amazon Linux 2023 Frontend Environment Setup Script
set -e

echo "Updating system packages..."
sudo dnf update -y

echo "Installing build tools and git..."
sudo dnf groupinstall "Development Tools" -y
sudo dnf install git curl -y

echo "Installing nvm (Node Version Manager)..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm for this shell session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Installing latest LTS Node.js (v20)..."
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'

echo "Node.js version:"
node -v
echo "npm version:"
npm -v

echo "Cloning your frontend repo (edit this line for your repo)..."
# git clone https://github.com/your-org/your-frontend-repo.git
# cd your-frontend-repo

echo "Installing project dependencies..."
npm install

echo "Setup complete! You can now run:"
echo "npm run dev   # for development"
echo "npm run build # for production build"
```
