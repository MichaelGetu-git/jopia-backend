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
                    }
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

        const job = await prisma.job.crete({
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
                    include: true
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
        const jobId = Number(req.params.id);

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
                skillIds,
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
                    include: true
                }
            }
        });
        return res.status(201).json({message: "Job updated successfully"});
    } catch (error : any) {
        return res.status(500).json({ message: error.message});
    }
});

router.delete('/:id', async (req, res) => {

});

router.get('/:id/applications', async (req, res) => {

});

router.post('/:id/apply', async (req, res) => {

});

router.post('/:id/save', async (req, res) => {

});

router.delete('/:id/save', async (req, res) => {

});

router.get('/saved', async (req, res) => {

});

router.get('/applied', async (req, res) => {

});

export default router;