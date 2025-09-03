import express from 'express';
import prisma from '../prismaClient'
const router = express.Router();

// GET /api/skills
router.get('/', async (req, res) => {
  try {
    const { search, limit = '50'} = req.query;

    const where:any = {};
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive'};
    }

    const skills = await prisma.skill.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { name: 'asc'}
    });
    res.json(skills);
  } catch (error : any) {
    res.status(500).json({message: error.message});
  }
});

// POST /api/skills
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    const skill = await prisma.skill.upsert({
      where: {
        name
      },
      update: {},
      create: { name }
    });
    res.status(201).json({ message: "Skill created successfully", skill});
  } catch (error : any) {
    res.status(500).json({ message: error.message});
  }
  
});

// GET /api/skills/popular
router.get('/popular', async (req, res) => {
  try {
    const poularSkills = await prisma.skill.findMany({
      include: {
        _count: {
          select: {
            profileSkills: true,
            jobSkills: true
          }
        }
      },
      orderBy: [
        {
          profileSkills: {
            _count: 'desc'
          }
        }
      ],
      take: 20
    });
    res.status(200).json({ message: 'Popular skills', poularSkills});
  } catch ( error : any) {
    res.status(500).json({ message: error.message});
  }
});

export default router;