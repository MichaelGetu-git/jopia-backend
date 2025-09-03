import express from 'express';
const router = express.Router();
import prisma from '../prismaClient.ts'
// GET /api/applications/me
router.get('/me', async (req, res) => {
    try {
        const appliedJobs = await prisma.jobApplication.findMany({
            where: {
              userId: (req as any).userId
            },
            include: {
                applicationStatus: true,
                job: {
                    include: {
                        company: true,
                        jobType: true,
                        experienceLevel: true,
                    }
                }
            },
            orderBy: { appliedDate: 'desc'}
        });
        return res.status(200).json({ message: "Applied Jobs", appliedJobs})
    } catch (error : any) {
        return res.status(500).json({ message: error.message})
    }
});

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.jobApplication.findUnique({
      where: { id: parseInt(id) },
      include: {
        job: true
      }
    })

    if ( application?.userId !== (req as any).userId) {
      const isAdmin = await prisma.companyUser.findFirst({
        where: {
          userId: ( req as any).userId,
          companyId: application?.job.companyId,
          role: { name: { in: ['companyId', 'recruiter']}}
        }
      });

      if (!isAdmin) {
        return res.status(403).json({message: 'Not authorized'})
      }
    }
    const applications = await prisma.jobApplication.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        job: {
          include: {
            company: true,
            jobType: true,
            experienceLevel: true,
          }
        }
      }
    });
    return res.status(200).json({message: "Application for the job", applications})
  } catch (error : any) {
    return res.status(500).json({ message: error.message});
  }
});

// PUT /api/applications/:id
router.put('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeLink, coverLetter } = req.body;

    const reApply = await prisma.jobApplication.updateMany({
      where: {
        id: parseInt(id),
        userId: (req as any).userId!,
        reviewedAt: null,
      },
      data: {
        resumeLink,
        coverLetter,
      },
    });
    return res.status(201).json({ message: "Application updated successfully", reApply});
  } catch (error : any) {
    return res.status(500).json({ messsage: error.message });
  }
});


// PUT /api/applications/:id
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId, notes } = req.body;

    const application = await prisma.jobApplication.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        job: {
          include: {
            company: {
              include: {
                companyUsers: {
                  where: {
                    userId: (req as any).userId!,
                    role: {
                      name: { in: ['companyAdmin', 'recruiter']}
                    }
                  }
                }
              }
            }
          }
        },
      }
    });

    if (!application || application.job.company.companyUsers.length === 0) {
      return res.status(403).json({ message: 'Not authorized to review this application'});
    }
    
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: parseInt(id)},
      data: {
        applicationStatusId: statusId,
        notes,
        reviewedAt: new Date()
      },
      include: {
        applicationStatus: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    });
    res.json({ message: 'Application status updated', application: updatedApplication})
  } catch (error : any) {
    return res.status(500).json({ messsage: error.message });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jobApplication.deleteMany({
      where: {
        id: parseInt(id),
        userId: (req as any).userId,
        reviewedAt: null
      }
    });
    return res.status(200).json({ message: "Application deleted successfully"});
  } catch (error : any) {
    return res.status(500).json({ message: error.message });
  }
});


export default router;