export default {
  development: {
    app: {
      port: process.env.PORT || 5000,
      env: 'development',
      debug: true,
    },
    database: {
      url: process.env.MONGODB_URI || 'mongodb://localhost:27017/lumina-events',
      debug: true,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      expiresIn: '7d',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dev',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dev',
    },
    email: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      from: process.env.EMAIL_FROM || 'dev@luminaevents.com',
    },
    logging: {
      level: 'debug',
      sentry: false,
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    }
  },

  staging: {
    app: {
      port: process.env.PORT || 5000,
      env: 'staging',
      debug: true,
    },
    database: {
      url: process.env.MONGODB_URI || 'mongodb+srv://staging-user:password@staging-cluster.mongodb.net/lumina-events-staging',
      debug: false,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: true,
      from: process.env.EMAIL_FROM || 'noreply@luminaevents-staging.com',
    },
    logging: {
      level: 'info',
      sentry: true,
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    cors: {
      origin: ['https://staging.luminaevents.com'],
      credentials: true,
    }
  },

  production: {
    app: {
      port: process.env.PORT || 5000,
      env: 'production',
      debug: false,
    },
    database: {
      url: process.env.MONGODB_URI,
      debug: false,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: true,
      from: process.env.EMAIL_FROM || 'noreply@luminaevents.com',
    },
    logging: {
      level: 'error',
      sentry: true,
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      max: 50, // Stricter in production
    },
    cors: {
      origin: ['https://luminaevents.com', 'https://www.luminaevents.com'],
      credentials: true,
    }
  }
};
