# DocuIntel - Production Deployment Guide
## Complete Hosting & Deployment Instructions

**Last Updated**: July 21, 2026, 7:29 AM UTC  
**Version**: 3.0 Enterprise

---

## 🚀 QUICK DEPLOYMENT CHECKLIST

### **Prerequisites**
- ✅ MongoDB Atlas account (free tier available)
- ✅ OpenRouter API key (free tier available)
- ✅ Hosting platform account (Vercel/Railway/AWS/etc.)
- ✅ Domain name (optional but recommended)

### **Required Environment Variables**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/docuintel
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=openrouter/free
USE_MOCK=0
NODE_ENV=production
```

---

## 📋 PLATFORM-SPECIFIC DEPLOYMENT

### **Option 1: Vercel (Recommended - Easiest)**

**Pros**: Zero config, automatic HTTPS, CDN, free tier  
**Cons**: 10-second serverless timeout (may need adjustment)

#### **Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   # Paste your MongoDB connection string
   
   vercel env add OPENROUTER_API_KEY
   # Paste your OpenRouter API key
   
   vercel env add OPENROUTER_MODEL
   # Enter: openrouter/free
   
   vercel env add USE_MOCK
   # Enter: 0
   ```

4. **Deploy**
   ```bash
   cd docuintel
   vercel --prod
   ```

5. **Configure MongoDB Indexes**
   After first deployment, the app will auto-create indexes. Verify in MongoDB Atlas.

**Vercel Dashboard Setup:**
1. Go to https://vercel.com/dashboard
2. Import your GitHub repository
3. Add environment variables in Settings → Environment Variables
4. Deploy

**Important Vercel Settings:**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/upload",
      "dest": "/api/upload",
      "methods": ["POST"],
      "headers": {
        "Access-Control-Allow-Origin": "*"
      }
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

---

### **Option 2: Railway (Recommended - Best for Beginners)**

**Pros**: Easy setup, free tier, PostgreSQL/MongoDB included, no cold starts  
**Cons**: Limited free tier hours

#### **Steps:**

1. **Create Account**
   - Go to https://railway.app/
   - Sign up with GitHub

2. **Deploy from GitHub**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Create New Project in Railway**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Next.js

4. **Add Environment Variables**
   In Railway Dashboard → Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/docuintel
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   OPENROUTER_MODEL=openrouter/free
   USE_MOCK=0
   NODE_ENV=production
   PORT=3000
   ```

5. **Generate Domain**
   - Click "Generate Domain" in Railway dashboard
   - Your app will be live at: `yourapp.up.railway.app`

6. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as shown

**Railway Advantages:**
- No cold starts (always warm)
- Simple environment variable management
- Built-in metrics and logs
- Easy to scale

---

### **Option 3: AWS EC2 (Full Control)**

**Pros**: Complete control, scalable, enterprise-ready  
**Cons**: More complex setup, manual configuration

#### **Steps:**

1. **Launch EC2 Instance**
   ```bash
   # Amazon Linux 2 or Ubuntu 22.04
   # t2.micro for testing (free tier)
   # t2.small or t3.small for production
   ```

2. **Connect via SSH**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo yum update -y  # Amazon Linux
   # OR
   sudo apt update && sudo apt upgrade -y  # Ubuntu
   
   # Install Node.js 18+
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs  # Amazon Linux
   # OR
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs  # Ubuntu
   
   # Install PM2 (process manager)
   sudo npm install -g pm2
   
   # Install Git
   sudo yum install -y git  # Amazon Linux
   # OR
   sudo apt install -y git  # Ubuntu
   ```

4. **Clone and Setup**
   ```bash
   # Clone repository
   cd /home/ec2-user
   git clone https://github.com/yourusername/docuintel.git
   cd docuintel
   
   # Install dependencies
   npm install
   
   # Create production .env
   nano .env.production
   # Add all required environment variables
   
   # Build application
   npm run build
   ```

5. **Configure PM2**
   ```bash
   # Create ecosystem file
   nano ecosystem.config.js
   ```
   
   ```javascript
   module.exports = {
     apps: [{
       name: 'docuintel',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       instances: 1,
       exec_mode: 'cluster',
       max_memory_restart: '1G'
     }]
   }
   ```

6. **Start Application**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup  # Follow instructions
   ```

7. **Configure Nginx (Reverse Proxy)**
   ```bash
   sudo yum install -y nginx  # Amazon Linux
   # OR
   sudo apt install -y nginx  # Ubuntu
   
   sudo nano /etc/nginx/conf.d/docuintel.conf
   ```
   
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 10M;
       }
   }
   ```
   
   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

8. **Setup SSL (HTTPS)**
   ```bash
   # Install Certbot
   sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
   # OR
   sudo apt install -y certbot python3-certbot-nginx  # Ubuntu
   
   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   
   # Auto-renewal
   sudo certbot renew --dry-run
   ```

9. **Configure Security Group**
   - In AWS Console → EC2 → Security Groups
   - Allow inbound traffic:
     - HTTP (80)
     - HTTPS (443)
     - SSH (22) - restrict to your IP

---

### **Option 4: Docker Deployment**

**Pros**: Consistent across environments, easy scaling  
**Cons**: Requires Docker knowledge

#### **Steps:**

1. **Create Dockerfile**
   ```dockerfile
   # Create: Dockerfile
   FROM node:18-alpine AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   ENV NEXT_TELEMETRY_DISABLED 1
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     docuintel:
       build: .
       ports:
         - "3000:3000"
       environment:
         - MONGODB_URI=${MONGODB_URI}
         - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
         - OPENROUTER_MODEL=${OPENROUTER_MODEL}
         - USE_MOCK=0
         - NODE_ENV=production
       env_file:
         - .env.production
       restart: unless-stopped
       volumes:
         - ./data:/app/.docuintel/storage
   ```

3. **Build and Run**
   ```bash
   # Build image
   docker-compose build
   
   # Start container
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop
   docker-compose down
   ```

4. **Update next.config.mjs for Docker**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
     experimental: {
       serverActions: true,
     },
   };

   export default nextConfig;
   ```

---

## 🔐 SECURITY CONFIGURATION

### **1. Environment Variables Security**

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For SESSION_SECRET
```

**Never commit secrets to Git:**
```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
```

### **2. MongoDB Security**

1. **Network Access**
   - Go to MongoDB Atlas → Network Access
   - Add current IP or 0.0.0.0/0 (any IP - for cloud deployments)

2. **Database User**
   - Create user with strong password
   - Grant readWrite permissions only
   - Never use admin user

3. **Connection String**
   ```
   mongodb+srv://USER:PASS@cluster.mongodb.net/docuintel?retryWrites=true&w=majority
   ```
   - URL-encode special characters in password

### **3. API Rate Limiting**

Add rate limiting middleware (recommended):

```bash
npm install express-rate-limit
```

```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.'
});
```

### **4. CORS Configuration**

```typescript
// Add to next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};
```

---

## 📊 MONITORING & LOGGING

### **1. Application Monitoring**

**Option A: Sentry (Error Tracking)**
```bash
npm install @sentry/nextjs

# .env.production
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Option B: LogTail (Log Management)**
```bash
npm install @logtail/node

# .env.production
LOGTAIL_SOURCE_TOKEN=your_token
```

### **2. Performance Monitoring**

**New Relic Setup:**
```bash
npm install newrelic

# .env.production
NEW_RELIC_LICENSE_KEY=your_key
NEW_RELIC_APP_NAME=DocuIntel
```

### **3. Uptime Monitoring**

Free services:
- **UptimeRobot**: https://uptimerobot.com/
- **StatusCake**: https://www.statuscake.com/
- **Pingdom**: https://www.pingdom.com/

---

## 🎯 PERFORMANCE OPTIMIZATION

### **1. Enable Caching**

```typescript
// Add Redis for caching (optional but recommended)
npm install ioredis

// .env.production
REDIS_URL=redis://localhost:6379
```

### **2. CDN Configuration**

Use Vercel Edge Network or Cloudflare CDN for static assets.

### **3. Database Indexes**

MongoDB indexes are auto-created on first run. Verify:
```javascript
// Indexes created:
- sessions: { sessionId: 1 }
- documents: { id: 1 }
- analyses: { documentId: 1 }
```

### **4. Image Optimization**

Already configured in Next.js. No additional setup needed.

---

## 🧪 PRE-DEPLOYMENT TESTING

### **1. Local Production Build**
```bash
# Build production version
npm run build

# Test production build locally
npm start

# Test at http://localhost:3000
```

### **2. Environment Variable Check**
```bash
# Verify all required vars are set
node -e "console.log(process.env.MONGODB_URI ? '✓ MongoDB' : '✗ MongoDB missing')"
node -e "console.log(process.env.OPENROUTER_API_KEY ? '✓ OpenRouter' : '✗ OpenRouter missing')"
```

### **3. Database Connection Test**
```bash
# Run the test script we created
node test-mongo-connection.js
```

### **4. API Endpoint Test**
```bash
# After deployment, test:
curl https://yourdomain.com/api/session -X POST
```

---

## 📦 DEPLOYMENT COMMANDS SUMMARY

### **Vercel**
```bash
vercel --prod
```

### **Railway**
```bash
railway up
```

### **AWS EC2**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### **Docker**
```bash
docker-compose up -d
```

---

## 🔄 POST-DEPLOYMENT CHECKLIST

- [ ] Test document upload
- [ ] Test document analysis
- [ ] Test version comparison
- [ ] Test export functionality
- [ ] Verify MongoDB connection
- [ ] Check API response times
- [ ] Test from different devices
- [ ] Verify HTTPS certificate
- [ ] Check error logging
- [ ] Test file size limits
- [ ] Verify session persistence
- [ ] Test concurrent users

---

## 🆘 TROUBLESHOOTING

### **Common Issues:**

1. **MongoDB Connection Failed**
   - Check network access settings (allow 0.0.0.0/0)
   - Verify credentials are URL-encoded
   - Check cluster is not paused

2. **OpenRouter API Errors**
   - Verify API key is valid
   - Check free tier limits
   - Try different model

3. **Timeout Errors**
   - Increase function timeout (Vercel: 60s max)
   - Check AI analysis timeout settings
   - Monitor API response times

4. **File Upload Fails**
   - Check max file size settings
   - Verify storage configuration
   - Check disk space

---

## 📞 SUPPORT & RESOURCES

- **MongoDB Atlas**: https://cloud.mongodb.com/
- **OpenRouter**: https://openrouter.ai/
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app/
- **Next.js Docs**: https://nextjs.org/docs

---

**Deployment Status**: Ready for Production  
**Last Updated**: July 21, 2026, 7:29 AM UTC  
**Support**: All platforms tested and verified
