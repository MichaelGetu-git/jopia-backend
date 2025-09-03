import express from 'express';
import prisma from '../prismaClient'
const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [usersCount, companiesCount, jobsCount] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.job.count(),
    ]);

    return res.status(200).json({
      message: "Insights",
      data: {
        usersCount, companiesCount, jobsCount
      }
    });
  } catch (error : any) {
    return res.status(500).json({ message: error.message});
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        profile: true,
        jobApplications: true,
      }
    });
    return res.status(200).json({ message: "Users", users})
  } catch (error : any) {
    return res.status(500).json({ message: error.message})
  }
});

// GET /api/admin/companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        companyUsers: true,
        jobs: true,
      }
    });
    return res.status(200).json({ message: "Companies", companies})
  } catch (error : any) {
    return res.status(500).json({ message: error.message})
  }
});

// GET /api/admin/jobs
router.get('/jobs', async (req, res) => {
    try {
      const jobs = await prisma.job.findMany({
        include: {
          category: true,
          jobType: true,
          experienceLevel: true,
          jobStatus: true,
          company: true
        }
      });
      return res.status(200).json({ message: "Jobs", jobs})
    } catch (error : any) {
      return res.status(500).json({ message: error.message})
    }
});

export default router;