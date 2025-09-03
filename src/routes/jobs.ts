import express from "express";
import prisma from '../prismaClient'
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {
            page = '1',
            limit = '10',
            search,
            location,
            jobTypeId,
            experienceLevelId,
            companyId,
            categoryId,
            skills,
        } = req.query;

        const skip = (parseInt(page as string) - 1 ) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const where: any = {
            deletedAt: null,
            jobStatus: {
                status: 'active'
            }
        };

        if (search) {
            where.OR = [
                {title: { contains: search as string, mode: 'insensitive'}},
                {description: { contains: search as string, mode: 'insensitive'}},
            ];
        }

        if (location) {
            where.jobLocation = {
                contains: location as string, mode: 'insensitive'
            };
        }
        if (jobTypeId) {
            where.jobTypeId = parseInt(jobTypeId as string);
        }

        if (experienceLevelId) {
            where.experienceLevelId = parseInt(experienceLevelId as string);
        }

        if (companyId) {
            where.companyId = parseInt(companyId as string);
        }

        if (categoryId) {
            where.categoryId = parseInt(categoryId as string);
        }

        if (skills) {
            const skillIds = (skills as string).split(',').map(Number);
            where.jobSkills = {
                some: {
                    skillId: { in: skillIds }
                }
            };
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                skip,
                take,
                include: {
                    company: true,
                    jobType: true,
                    experienceLevel: true,
                    category: true,
                    jobSkills: {
                        include: {
                            skill: true
                        }
                    }
                },
                orderBy: [
                    { isUrgent: 'desc'},
                    { postingDate: 'desc'}
                ]
            }),
        prisma.job.count({where})

        ]);
        return res.json({
            jobs,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total/parseInt(limit as string))
            }
        });
    } catch (error : any) {
        return res.status(500).json({message: error.message})
    }
});


router.get('/saved', async (req, res) => {
    try {
        const savedJobs = await prisma.savedJob.findMany({
            where: {
                userId: (req as any).userId,
            },
            include: {
                job: {
                    include: {
                        company: true,
                        jobType: true,
                        experienceLevel: true
                    }
                }
            },
            orderBy: {savedAt: 'desc'}
        });
        return res.status(200).json({message: "Saved jobs", savedJobs});
    } catch (error : any) {
        return res.status(500).json({ message: error.message });
    }
});

router.get('/applied', async (req, res) => {
    try {
        const appliedJobs = await prisma.jobApplication.findMany({
            where: {
                userId: ( req as any).userId
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

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const job = await prisma.job.findFirst({
            where: {
                id: parseInt(id),
                deletedAt: null
            },
            include: {
                company: true,
                jobType: true,
                experienceLevel: true,
                jobStatus: true,
                category: true,
                jobSkills: {
                    include: {
                        skill: true
                    }
                }
            }
        });

        if (!job) { return res.status(404).json("Job not found")};

        await prisma.job.update({
            where: { id: parseInt(id) },
            data: { viewCount: { increment: 1}}
        });

        if (userId) {
            await prisma.jobView.upsert({
                where: {
                        userId_jobId: {
                            userId,
                            jobId: parseInt(id)
                        },
                        jobId: parseInt(id)
                },
                update: { viewedAt: new Date()},
                create: {
                    userId,
                    jobId: parseInt(id)
                }
            });
        }

        return res.json(job);
    } catch(error: any) {
        return res.status(500).json({ message: error.message})
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            minPrice,
            maxPrice,
            salaryType,
            jobLocation,
            applicationDeadline,
            benefits,
            requirements,
            responsibilities,
            companyId,
            categoryId,
            jobTypeId,
            experienceLevelId,
            skillIds,
            isUrgent = false
        } = req.body;

        const companyUser = await prisma.companyUser.findFirst({
            where: {
                userId: (req as any).userId!,
                companyId,
                role: {
                    name: { in: ['companyAdmin', 'recruiter']}
                }
            }
        });

        if (!companyUser) { return res.status(403).json({message: 'Not authorized to post jobs'})};

        const activeStatus = await prisma.jobStatus.findFirst({
            where: { status: 'active' }
        });

        const job = await prisma.job.create({
            data: {
                title,
                description,
                minPrice,
                maxPrice,
                salaryType,
                jobLocation,
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                benefits,
                requirements,
                responsibilities,
                companyId,
                jobStatusId: activeStatus!.id,
                jobTypeId,
                categoryId,
                experienceLevelId,
                isUrgent,
                jobSkills: {
                    create: skillIds?.map((skillId: number)=> ({
                        skillId
                    })) || []
                }
            },
            include: {
                company: true,
                jobType: true,
                experienceLevel: true,
                jobSkills: {
                    include: { skill : true}
                }
            }
        });
        return res.status(201).json({message: "Job created Successfully", job});
    } catch (error : any) {
        return res.status(500).json({message: error.message});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {
            title,
            description,
            minPrice,
            maxPrice,
            salaryType,
            jobLocation,
            applicationDeadline,
            benefits,
            requirements,
            responsibilities,
            companyId,
            categoryId,
            jobTypeId,
            experienceLevelId,
            skillIds,
            isUrgent = false
        } = req.body;

        const userId = (req as any).userId;
        const jobId = parseInt(req.params.id);

        const job = await prisma.job.findUnique({
            where: { id: jobId}
        });

        if (!job) { return res.status(404).json({ message: "Job not found!"})};

        const companyUser = await prisma.companyUser.findFirst({
            where: {
                userId,
                companyId: job.companyId,
                role: {
                    name: { in: ['companyAdmin', 'recruiter']}
                }
            }
        });

        if (!companyUser) { return res.status(403).json({ message: "Unauthorized to update this job"})};

        const activeStatus = await prisma.jobStatus.findFirst({
            where: { status: 'active'}
        })
        await prisma.jobSkill.deleteMany({
            where: { jobId }
        })
        const updatedJobs = await prisma.job.update({
            where: { id: jobId},
            data: {
                title,
                description,
                minPrice,
                maxPrice,
                salaryType,
                jobLocation,
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                benefits,
                requirements,
                responsibilities,
                categoryId,
                companyId: job.companyId,
                jobStatusId: activeStatus!.id,
                jobTypeId,
                experienceLevelId,
                isUrgent,
                jobSkills: {
                    create: skillIds?.map((skillId: number)=> ({
                        skillId
                    })) || []
                }
            },
            include: {
                company: true,
                jobType: true,
                experienceLevel: true,
                jobSkills: {
                    include: { skill : true}
                }
            }
        });
        return res.status(201).json({message: "Job updated successfully", updatedJobs});
    } catch (error : any) {
        return res.status(500).json({ message: error.message});
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const jobId = parseInt(req.params.id);

        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        if (!job) { return res.status(404).json({ message: "Job not found"})};

        const companyUser = await prisma.companyUser.findFirst({
            where: {
                userId,
                companyId: job.companyId,
                role: {
                    name: { in: ['companyAdmin', 'recruiter']}
                }
            }
        });

        if (!companyUser) { return res.status(403).json({message: 'Not authorized to delete this job'})};

        await prisma.job.update({
            where: { 
                id: jobId,
            },
            data: {
                deletedAt: new Date(),
            }
        });
        return res.json({message: "Job deleted successfully"});
    } catch (error : any) {
        return res.status(500).json({ message: error.message});
    }
});

router.get('/:id/applications', async (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        const applications = await prisma.jobApplication.findMany({
            where: { jobId: jobId},
            include: {
                user: true,
                job: true,
                applicationStatus: true,
            }
        });

        return res.status(200).json({message: "Applications", applications})
    } catch (error : any) {
        return res.status(500).json({message: error.message})
    }
});

router.post('/:id/apply', async (req, res) => {
    try {
        const { id } = req.params;
        const { resumeLink, coverLetter } = req.body;

        const job = await prisma.job.findFirst({
            where: {
                id: parseInt(id),
                deletedAt: null,
                jobStatus: {
                    status: 'active'
                }
            }
        });

        if (!job) {
            return res.status(404).json({ message: "Job not found"});
        }

        const existingApplication = await prisma.jobApplication.findUnique({
            where: {
                userId_jobId: {
                    userId: (req as any).userId!,
                    jobId: parseInt(id)
                }
            }
        });

        if (existingApplication) { return res.status(400).json({ message: 'Applied to this job Already'})};

        const pendingStatus = await prisma.applicationStatus.findFirst({
            where: { status: 'pending'}
        });

        const application = await prisma.jobApplication.create({
            data: {
                userId: (req as any).userId!,
                jobId: parseInt(id),
                applicationStatusId: pendingStatus!.id,
                resumeLink,
                coverLetter
            }, 
            include: {
                job: {
                    include: {
                        company: true
                    }
                },
                applicationStatus: true
            }
        });
        return res.status(201).json({ message: "Applied successfully"});
    } catch (error : any) {
        return res.status(500).json({message: error.message});
    }
});

router.post('/:id/save', async (req, res) => {
    try {
        const { id } = req.params;

        const savedJob = await prisma.savedJob.upsert({
            where: {
                userId_jobId: {
                    userId: (req as any).userId!,
                    jobId: parseInt(id)
                }
            },
            update: {},
            create: {
                userId: (req as any).userId!,
                jobId: parseInt(id)
            }
        });

        return res.status(201).json({ message: 'Job saved successfully', savedJob});
    } catch (error : any) {
        return res.status(500).json({ message: error.message});
    }
});

router.delete('/:id/save', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.savedJob.delete({
            where: {
                userId_jobId: {
                    userId: (req as any).userId!,
                    jobId: parseInt(id)
                }
            }
        });
        return res.json({ message: "Saved job deleted successfully"})
    } catch (error : any) {
        return res.status(500).json({ message: error.message})
    }
});

export default router;