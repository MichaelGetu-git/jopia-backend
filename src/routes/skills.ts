import express from 'express';
const router = express.Router();

// GET /api/skills
router.get('/', async (req, res) => {
  // Get all skills with search/pagination
});

// POST /api/skills
router.post('/', async (req, res) => {
  // Create new skill (admin only, or auto-create)
});

// GET /api/skills/popular
router.get('/popular', async (req, res) => {
  // Get most popular skills
});

export default router;