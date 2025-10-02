# Deploying Book Review Frontend to AWS EC2

This guide provides step-by-step instructions to move and run the frontend code on an AWS EC2 instance. The backend service is already installed on the same box. Follow these steps to ensure a smooth deployment for any new team member.

---

## 1. Prerequisites
- Access to the AWS EC2 instance (IP, username, SSH key)
- Backend service running and accessible on the same box
- Your local frontend code ready to deploy

---

## 2. Install Node.js and npm (if not installed)


### For Amazon Linux 2 (Recommended: nvm)

Amazon Linux 2 does not provide a reliable way to install Node.js via yum or amazon-linux-extras. The recommended method is to use nvm (Node Version Manager):

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 16
nvm use 16
```
This will install Node.js 16.x for your user only (not system-wide).

#### Advanced/Troubleshooting (not recommended, may fail):
You can try NodeSource or EPEL, but these often fail due to glibc incompatibility:
```sh
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs-16.*
```
or
```sh
sudo yum install -y epel-release
sudo yum install -y nodejs npm
```

Verify installation:
```sh
node -v
npm -v

If you still see "command not found" for either, try the following troubleshooting steps for Amazon Linux 2:

1. **Check for errors during installation:**
   - Review the output of the install commands for any errors or warnings.

2. **Try installing Node.js from EPEL repository (fallback):**
   ```sh
   sudo yum install -y epel-release
   sudo yum install -y nodejs npm
   ```
   - This may install an older version, but is sometimes available on Amazon Linux 2.

3. **Check your PATH:**
   - Run `echo $PATH` and ensure `/usr/bin` or `/usr/local/bin` is included.
   - Try running `which node` and `which npm` to see if they are installed but not in your PATH.

4. **Check symlinks:**
   - Sometimes, Node.js is installed as `nodejs` instead of `node`. Try running `nodejs -v`.
   - If `nodejs` works, create a symlink:
     ```sh
     sudo ln -s $(which nodejs) /usr/bin/node
     ```

If the problem persists, consult the AWS documentation for Node.js installation or consider using a Docker container for the frontend build.
```

If you see "command not found" for either, repeat the installation step for your OS. For Ubuntu/Debian, use:
```sh
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```
If the problem persists, check your PATH or consult the AWS documentation for Node.js installation.
```

---

## 3. Copy Code to EC2
1. **Open terminal on your local machine.**
2. **Use `scp` to copy the project folder to EC2:**
   ```sh
   scp -i /path/to/your-key.pem -r /path/to/book-review-frontend ec2-user@<EC2-IP>:/home/ec2-user/
   ```
   - Replace `/path/to/your-key.pem` with your SSH key path
   - Replace `<EC2-IP>` with your EC2 instance's public IP

---

## 4. Connect to EC2
1. **SSH into the EC2 instance:**
   ```sh
   ssh -i /path/to/your-key.pem ec2-user@<EC2-IP>
   ```

---

## 5. Install Dependencies
1. **Navigate to the project directory:**
   ```sh
   cd ~/book-review-frontend
   ```
2. **Install Node.js dependencies:**
   ```sh
   npm install
   ```

---

## 6. Build the Frontend
1. **Build the production assets:**
   ```sh
   npm run build
   ```
   - This will create a `dist/` folder with static files

---

## 7. Serve the Frontend
### Option 1: Using `serve` (recommended for static sites)
1. **Install `serve` globally if not already installed:**
   ```sh
   npm install -g serve
   ```
2. **Serve the build output:**
   ```sh
   serve -s dist -l 3000
   ```
   - The frontend will be available at `http://<EC2-IP>:3000`

### Option 2: Using Nginx (for production)
1. **Install Nginx:**
   ```sh
   sudo yum install nginx -y   # For Amazon Linux
   sudo apt-get install nginx  # For Ubuntu/Debian
   ```
2. **Copy build files to Nginx web root:**
   ```sh
   sudo cp -r dist/* /usr/share/nginx/html/
   ```
3. **Restart Nginx:**
   ```sh
   sudo systemctl restart nginx
   ```
   - The frontend will be available at `http://<EC2-IP>/`

---

## 8. Configure Environment (Optional)
- If you need to connect to the backend, update API URLs in your `.env` or config files to point to the backend service on the same box (e.g., `http://localhost:8000`).

---

## 9. Troubleshooting
- Check logs for errors:
  ```sh
  tail -f /var/log/nginx/error.log
  tail -f /var/log/nginx/access.log
  ```
- Ensure ports (3000 for `serve`, 80 for Nginx) are open in EC2 security group
- Verify Node.js and npm versions

---

## 10. Maintenance
- To update the code, repeat steps 2–5
- Restart the server after updates

---

## 11. Useful Commands
- **Stop `serve`:** Press `Ctrl+C` in the terminal
- **Restart Nginx:** `sudo systemctl restart nginx`
- **Check running processes:** `ps aux | grep node`

---

## 12. Contact
- For issues, contact the DevOps team or refer to project documentation

---

**Deployment complete!**
