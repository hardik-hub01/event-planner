import config from '../config/environment.js';

export const getConfig = (env = process.env.NODE_ENV || 'development') => {
  return config[env] || config.development;
};

export const getCurrentConfig = () => {
  return config[process.env.NODE_ENV || 'development'];
};
