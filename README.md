# Citation Formatter Backend

A robust Node.js API for formatting academic references in multiple citation styles with intelligent reference lookup.

## 🚀 Features

- **8 Citation Styles**: APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA, ASA
- **Smart Reference Lookup**: DOI and title-based searches
- **Multiple APIs**: CrossRef and Semantic Scholar integration
- **Rate Limiting**: Built-in protection against abuse
- **Caching**: Redis-based caching for improved performance
- **Security**: Helmet, CORS, and input validation
- **Monitoring**: Comprehensive logging and error tracking
- **Docker Support**: Containerized deployment
- **CI/CD**: Automated testing and deployment

## 🏗️ Architecture

- **Framework**: Express.js
- **Language**: Node.js 18+
- **Database**: PostgreSQL (optional)
- **Cache**: Redis (optional)
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Docker (optional)
- PostgreSQL (optional)
- Redis (optional)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/citation-formatter-backend.git
cd citation-formatter-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Start development server
```bash
npm run dev
```

## 🐳 Docker Setup

### Build and run with Docker
```bash
npm run docker:build
npm run docker:run
```

### Stop Docker containers
```bash
npm run docker:stop
```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in watch mode
```bash
npm run test:watch
```

## 🔧 Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run with Docker Compose
- `npm run docker:stop` - Stop Docker containers

## 📚 API Documentation

### Health Check
```bash
GET /health
```

### Format References
```bash
POST /api/format
Content-Type: application/json

{
  "references": "10.1038/s41586-020-2649-2",
  "format": "apa"
}
```

### Download References
```bash
POST /api/download
Content-Type: application/json

{
  "references": "10.1038/s41586-020-2649-2",
  "format": "bibtex"
}
```

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Request validation
- **Environment Variables**: Secure configuration

## 📊 Monitoring

- **Winston**: Structured logging
- **Health Checks**: Service health monitoring
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Request timing and metrics

## 🚀 Deployment

### Railway
```bash
# Deploy to Railway
railway deploy
```

### Render
```bash
# Deploy to Render
render deploy
```

### Docker
```bash
# Build and deploy
docker build -t citation-formatter-backend .
docker run -p 3000:3000 citation-formatter-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- **Frontend**: [citation-formatter-frontend](https://github.com/yourusername/citation-formatter-frontend)
- **Documentation**: [Full Documentation](https://github.com/yourusername/citation-formatter)

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.
