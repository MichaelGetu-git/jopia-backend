import express from 'express';
import prisma from '../prismaClient'
const router = express.Router();

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit =  '10', search, industry } = req.query;
    const skip = (parseInt(page as string) - 1)* parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive'};
    }

    if (industry) {
      where.industry = industry as string;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { jobs: true }
          }
        }
      }),
      prisma.company.count({ where })
    ]);
    res.status(200).json({
      companies,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch ( error : any) {
    res.status(500).json({ message: error.message });
  }
});


// GET /api/companies/me/jobs
router.get('/me/jobs', async (req, res) => {
  try {
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId: (req as any).userId,
      },
      include: { company: true }
    });

    if (!companyUser) { return res.status(404).json({message: "You dont belong in any company"})};

    const jobs = await prisma.job.findMany({
      where: {
        companyId: companyUser.companyId 
      },
      include: {
        category: true,
        jobType: true,
        experienceLevel: true,
        jobStatus: true,
      }
    });
    res.status(200).json({
      company: companyUser.company, jobs
    });
  } catch (error : any) {
    res.status(500).json( { message: error.message})
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(id)},
      include: {
        jobs: {
          where: {
            deletedAt: null,
            jobStatus: {
              status: 'active'
            }
          },
          include: {
            jobType: true,
            experienceLevel: true
          },
          orderBy: { postingDate: 'desc' }
        },
        _count: {
          select: { jobs: true }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found"});
    }

    res.status(200).json({ message: "Company", company});
  } catch (error : any) {
    res.status(500).json({ message: error.message});
  }
});

// POST /api/companies
router.post('/', async (req, res) => {
  try {
    const { name, industry, location, size, description, website } = req.body;

    const user = await prisma.user.findUnique({
      where: {id: (req as any).userId},
      include: {role: true }
    });

    if (!user || user.role.name !=='superAdmin') {
      return res.status(403).json({message: "Not Authroized to add companies"});
    }
    const company = await prisma.company.create({
      data: {
        name,
        industry,
        location,
        description,
        size,
        website,
      },
      include: {
          companyUsers: true
      }
    });
    res.status(201).json({message: "Company created successfully", company});
  } catch (error : any) {
    res.status(500).json({ message: error.message})
  }
});

// PUT /api/companies/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, industry, location, size, description, website }  = req.body;
    const companyId = parseInt(req.params.id)

    const isSuperAdmin = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      include: { role: true},
    });

    if (isSuperAdmin?.role?.name === 'superAdmin') {
      const updatedCompany = await prisma.company.update({
        where: {
          id: companyId
        },
        data: {
          name,
          industry,
          location,
          size,
          description,
          website,
        },
        include: {
          companyUsers: true
        }
      });
      return res.status(201).json({ message: "Company updated successfully", updatedCompany})
    } 
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId: (req as any).userId,
        companyId: companyId,
        role: {
          name: 'companyAdmin'
        },
      },
    });

    if (!companyUser) { return res.status(403).json({ message: "Not Authroized to update company"})};

    const updatedCompany = await prisma.company.update({
      where: {
        id: companyId
      },
      data: {
        name,
        industry,
        location,
        size,
        description,
        website,
      },
      include: {
        companyUsers: true
      }
    });
    res.status(201).json({ message: "Company updated successfully", updatedCompany})
  } catch (error : any) {
    res.status(500).json({ messsage: error.message})
  }
});

// === Company Jobs ===
// GET /api/companies/:id/jobs
router.get('/:id/jobs', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id: parseInt(id)},
      include: {
        jobs: {
          where: {
            deletedAt: null,
            jobStatus: {
              status: 'active'
            }
          },
          include: {
            jobType: true,
            experienceLevel: true
          },
          orderBy: { postingDate: 'desc' }
        },
        _count: {
          select: { jobs: true }
        }
      }
    });
    res.status(200).json({message: "Jobs of company", company});
  } catch (error : any) {
    res.status(500).json({ message: error.message});
  }
});

// === Company Users ===
// GET /api/companies/:id/users
router.get('/:id/users', async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const userId = (req as any).userId;

    const admin = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: { name: 'companyAdmin'}
      }
    });
    if (!admin) { return res.status(403).json({ message: "Not Authroized to view users"})};

    const members = await prisma.companyUser.findMany({
      where: { companyId },
      include: {
        user: true,
        role: true
      }
    });
    res.status(200).json({ message: "Company Users", members})
  } catch (error : any) {
    res.status(500).json({message: error.message});
  }
});

// POST /api/companies/:id/users
router.post('/:id/users', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { roleId } = req.body;
    const companyId = parseInt(req.params.id);
    const admin = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: { name: 'companyAdmin'}
      }
    });

    if (!admin) { return res.status(403).json({ message: "Not Authroized to add user"})};

    const addMember = await prisma.companyUser.create({
      data: {
        userId,
        companyId,
        roleId,
      },
      include: {
        user: true,
        role: true
      }
    });
    res.status(200).json({ message: "User added to company", addMember});
  } catch (error : any) {
    res.status(500).json({ message: error.message});
  }
});

// DELETE /api/companies/:id/users/:userId
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const companyId = parseInt(req.params.id);
    const admin = await prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        role: { name: 'companyAdmin'}
      }
    });
    if (!admin) { return res.status(403).json({ message: "Not Authroized to remove user"})};
    const removeMember = await prisma.companyUser.delete({
      where: {
        userId_companyId: {
          userId: parseInt(userId),
          companyId,
        }
      }
    });
    res.status(200).json({ message: "User removed from company", removeMember});
  } catch (error : any) {
    res.status(500).json({ message: error.message});
  }
});

export default router;
