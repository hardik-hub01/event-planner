import express from 'express';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Event categories data
const categories = {
  wedding: {
    name: 'Royal Wedding',
    description: 'Create unforgettable moments with elegant celebrations',
    packages: [
      { id: 'wedding-silver', name: 'Silver', basePrice: 50000, maxGuests: 50 },
      { id: 'wedding-gold', name: 'Gold', basePrice: 100000, maxGuests: 100 },
      { id: 'wedding-platinum', name: 'Platinum', basePrice: 200000, maxGuests: 300 },
      { id: 'wedding-diamond', name: 'Diamond', basePrice: 500000, maxGuests: 500 }
    ]
  },
  corporate: {
    name: 'Corporate Events',
    description: 'Professional events for your business needs',
    packages: [
      { id: 'corp-basic', name: 'Basic', basePrice: 30000, maxGuests: 50 },
      { id: 'corp-plus', name: 'Plus', basePrice: 75000, maxGuests: 150 },
      { id: 'corp-premium', name: 'Premium', basePrice: 150000, maxGuests: 300 },
      { id: 'corp-elite', name: 'Elite', basePrice: 300000, maxGuests: 500 }
    ]
  },
  birthday: {
    name: 'Birthday Bash',
    description: 'Celebrate your special day in style',
    packages: [
      { id: 'bday-starter', name: 'Starter', basePrice: 20000, maxGuests: 30 },
      { id: 'bday-deluxe', name: 'Deluxe', basePrice: 50000, maxGuests: 75 },
      { id: 'bday-premium', name: 'Premium', basePrice: 100000, maxGuests: 150 },
      { id: 'bday-grand', name: 'Grand', basePrice: 200000, maxGuests: 300 }
    ]
  }
  // Add more categories as needed
};

// Get all categories
router.get('/categories', optionalAuth, (req, res) => {
  res.json(categories);
});

// Get specific category
router.get('/categories/:id', optionalAuth, (req, res) => {
  const category = categories[req.params.id];

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  res.json({
    id: req.params.id,
    ...category
  });
});

// Get all packages
router.get('/packages', optionalAuth, (req, res) => {
  const allPackages = [];

  for (const [categoryId, category] of Object.entries(categories)) {
    category.packages.forEach(pkg => {
      allPackages.push({
        id: pkg.id,
        categoryId,
        categoryName: category.name,
        packageName: pkg.name,
        basePrice: pkg.basePrice,
        maxGuests: pkg.maxGuests
      });
    });
  }

  res.json(allPackages);
});

export default router;
