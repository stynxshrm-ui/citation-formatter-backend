# Backend Deployment on Render

This guide will help you deploy the Citation Formatter Backend to Render.

## 🚀 Quick Deploy to Render

### Method 1: Using Render Dashboard (Recommended)

1. **Sign up/Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up or login with your GitHub account

2. **Connect Repository**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `citation-formatter-backend` repository

3. **Configure Service**
   - **Name**: `citation-formatter-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   CROSSREF_API_URL=https://api.crossref.org
   SEMANTIC_SCHOLAR_API_URL=https://api.semanticscholar.org
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   LOG_LEVEL=info
   CACHE_TTL=3600
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your backend will be available at `https://your-service-name.onrender.com`

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Commit render.yaml**
   - The `render.yaml` file is already configured
   - Commit and push to your repository

2. **Deploy from Repository**
   - In Render dashboard, click "New +" → "Blueprint"
   - Select your repository
   - Render will automatically detect and use the `render.yaml` configuration

## 🔧 Environment Variables

### Required Variables
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render's default port)
- `CORS_ORIGIN`: Your frontend domain (e.g., `https://your-app.vercel.app`)

### Optional Variables
- `CROSSREF_API_URL`: `https://api.crossref.org`
- `SEMANTIC_SCHOLAR_API_URL`: `https://api.semanticscholar.org`
- `RATE_LIMIT_WINDOW_MS`: `900000` (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: `100`
- `LOG_LEVEL`: `info`
- `CACHE_TTL`: `3600` (1 hour)

## 🌐 CORS Configuration

Update the CORS origin in your backend to allow your frontend domain:

```javascript
// In src/server.js, update the CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001', // Development
    'https://your-frontend-domain.vercel.app', // Production frontend
    process.env.CORS_ORIGIN // Additional domains from environment
  ].filter(Boolean),
  credentials: true
}));
```

## 📊 Monitoring and Logs

### Health Check
- Render automatically monitors `/health` endpoint
- Service will restart if health checks fail

### Logs
- View logs in Render dashboard
- Logs are available in real-time during deployment
- Historical logs are available for debugging

### Metrics
- Monitor performance in Render dashboard
- Set up alerts for downtime or high error rates

## 🔄 Updating Your Deployment

### Automatic Deployments
- Render automatically deploys on every push to main branch
- Manual deployments can be triggered from the dashboard

### Environment Variable Updates
1. Go to your service dashboard
2. Navigate to "Environment"
3. Update variables as needed
4. Redeploy the service

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
- Check build logs for errors
- Verify all dependencies are in `package.json`
- Ensure `npm start` command works locally

#### CORS Errors
- Verify `CORS_ORIGIN` is set correctly
- Check that frontend domain matches exactly
- Ensure protocol (http/https) is correct

#### API Timeouts
- Render free tier has request timeouts
- Consider upgrading to paid plan for better performance
- Implement request caching to reduce API calls

#### Environment Variables Not Working
- Check variable names match exactly
- Ensure no extra spaces or quotes
- Redeploy after changing environment variables

### Getting Help

1. Check Render service logs
2. Verify environment variables
3. Test API endpoints manually
4. Check CORS configuration
5. Review build logs for errors

## 📈 Performance Optimization

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- Cold start can take 30+ seconds
- Limited CPU and memory resources

### Paid Tier Benefits
- Always-on services
- Faster cold starts
- More CPU and memory
- Custom domains
- Better monitoring

### Optimization Tips
- Implement caching for API responses
- Use connection pooling for databases
- Optimize bundle size
- Implement health checks
- Use CDN for static assets

## 🔒 Security Considerations

### Environment Variables
- Never commit sensitive data to repository
- Use Render's environment variable system
- Rotate API keys regularly

### CORS
- Only allow necessary origins
- Use HTTPS in production
- Implement proper authentication if needed

### Rate Limiting
- Configure appropriate rate limits
- Monitor for abuse
- Implement IP-based blocking if necessary

## 📝 Deployment Checklist

Before deploying:

- [ ] Repository is connected to Render
- [ ] Environment variables are configured
- [ ] CORS origin is set to frontend domain
- [ ] Health check endpoint is working
- [ ] All dependencies are in package.json
- [ ] Start command is correct
- [ ] Build command is correct

After deploying:

- [ ] Service is running and healthy
- [ ] API endpoints are accessible
- [ ] CORS is working with frontend
- [ ] Logs are being generated
- [ ] Health checks are passing
- [ ] Frontend can connect to backend

## 🔄 Rollback Strategy

### Automatic Rollbacks
- Render can automatically rollback on failed deployments
- Previous deployments are available in dashboard

### Manual Rollbacks
1. Go to service dashboard
2. Navigate to "Deploys"
3. Select previous successful deployment
4. Click "Rollback"

## 📞 Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- Render Support: Available in dashboard
- Community: [Render Community Forum](https://community.render.com)
