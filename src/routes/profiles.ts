import express from 'express'
import prisma from '../prismaClient'

const router = express.Router();

router.get('/me', async(req, res)=> {
    try {
        const user = await prisma.user.findUnique({
            where: {userId: (req as any).user.userId},
            include: {
                educations: true,
                experiences: {
                    include: {
                        jobType: true
                    }
                },
                portfolios: true,
                socialLinks: true,
                profileSkills: {
                    include: {
                        skill: true
                    }
                }
            }
        });

        if (!user) return res.status(404).json({message: 'User not found'});

        res.json(user);
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
});


router.put('/me', async(req, res)=> {
    try {
        const { name, phone, location, aboutMe, bio, currJobLocation } = req.body;

        const profile = await prisma.profile.update({
            where: {userId: (req as any).user.userId},
            data: {
                name,
                phone,
                location,
                aboutMe,
                bio,
                currJobLocation
            }
        });

        res.json({ message: 'Profile Updated successfully', profile});
    } catch(error : any) {
        res.status(500).json({ message: error.message});
    }
});

router.get('/:id', async(req, res)=> {
    try {
        const { id } = req.params;

        const profile = await prisma.profile.findUnique({
            where: { id: parseInt(id)},
            include: {
                educations: true,
                experiences: {
                    include: {
                        jobType: true
                    }
                },
                portfolios: true,
                socialLinks: true,
                profileSkills: {
                    include: {
                        skill: true
                    }
                }
            }
            
        });

        if (!profile) {
            return res.status(404).json({error: 'Profile not found'});
        }
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ message: error.message})
    }
});


router.post('/me/educations', async(req, res)=> {
   try {
    const { uniName, degreeLevel, startYear, endYear, field, description } = req.body;

    const profile = await prisma.profile.findUnique({
        where: { userId: (req as any).userId},
    });

    if (!profile) { return res.status(404).json({ message: 'Profile not found'});}

    const education = await prisma.education.create({
        data: {
            uniName,
            degreeLevel,
            startYear,
            endYear,
            field,
            description,
            profileId: profile.id
        }
    });

    res.status(201).json({ message: 'Education added succesfully', education});
   } catch (error : any) {
        res.status(500).json({ message: error.message})
   }
});

router.put('/me/educations/:id', async(req, res)=> {
    try {
        const { uniName, degreeLevel, startYear, endYear, field, description} = req.body

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId}
        });

        if (!profile) {
            return res.status(404).json({message: 'Profile not found'});
        }
        const educations = await prisma.education.update({
            where: {id: req.params.id},
            data: {
                uniName,
                degreeLevel,
                startYear,
                endYear,
                field,
                description,
                profileId: profile.id
            }
        });

        res.json({message: 'Educations updated successfully', educations})
    } catch (error : any) {
        res.status(500).json({ message: error.message});
    }
});

router.delete('/me/educations/:id', async (req, res) => {
    try {
        const  id = (req as any).params.id

        await prisma.education.delete({
            where: { id: id}
        });

        res.json({message: "Education deleted successfully"});
    } catch (error : any) {
        return res.status(500).json({message: error.message})
    } 
})


router.post('/me/experiences', async(req, res)=> {
    try {
        const { jobTitle, jobTypeId, startTime, endTime, description } = req.body;

        const profile = await prisma.profile.findUnique({
            where: {userId: (req as any).userId}
        });

        if (!profile) {
            return res.status(404).json({message: 'Profile not found'})
        }

        const experience = await prisma.experience.create({
            data: {
                jobTitle,
                jobTypeId,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                description,
                profileId: profile.id
            },
            include: {
                jobType: true
            }
        });

        res.status(201).json({ message: 'Experience added successfuly', experience});
    } catch (error : any) {
        res.status(500).json({ message: error.message})
    }
});

router.put('/me/experiences/:id', async(req, res)=> {
    try {
        const { jobTitle, jobTypeId, startTime, endTime, description } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: ( req as any).userId}
        });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found'});
        }
        const experience = await prisma.experience.update({
            where: {id: req.params.id},
            data: {
                jobTitle,
                jobTypeId,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                description,
                profileId: profile.id
            },
            include: {
                jobType: true
            }
        });

        res.status(201).json({ message: 'Experiences updated successfully', experience})
    } catch (error : any) {
        res.status(500).json({message: error.message})
    }
})


router.delete('/me/experiences/:id', async(req, res)=> {
    try {
        const id = (req as any).params.id;

        await prisma.experience.delete({
            where: { id: id}
        });

        res.json({ message: "Experience deleted successfully"});
    } catch (error : any) {
        res.status(500).json({ message: error.message});
    }
});

router.post('/me/portfolios', async(req, res)=> {
    try {
        const { resume, portfolioLink } = req.body

        const profile = await prisma.profile.findUnique({
            where: {userId: (req as any).userId}
        });

        if (!profile) { return res.status(404).json({message: "Profile not found"})};

        const portfolio = await prisma.portfolio.create({
            data: {
                resume,
                portfolioLink,
                profileId: profile.id
            }
        });
        res.status(201).json({ message: "Portfolio created successfully", portfolio});

    } catch (error : any) {
        res.status(500).json({ message: error.message});
    }
});


router.put('/me/portfolios/:id', async(req, res)=> {
    try {
        const { resume, portfolioLink } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId}
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found"})};

        const portfolio = await prisma.portfolio.update({
            where: { id: req.params.id},
            data: {
                resume,
                portfolioLink,
                profile: profile.id
            }
        });
        res.status(201).json({ message: "Portfolio updated successfully", portfolio})
    } catch (error : any) {
        res.status(500).json({ message: error.message});
    }
});


router.delete('/me/portfolios/:id', async(req, res)=> {
    try {
        await prisma.portfolio.delete({
            where: { id: (req as any).params.id}
        });
        res.json({ message: "Portfolio deleted successfully"});
    } catch (error : any) {
        res.status(500).json({ message: error.message});
    } 
});


router.get('/me/social-links', async(req, res)=> {
    try {
        const { platform, link } = req.body

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId}
        });

        if (!profile) { return res.status(404).json({message: "profile not found"})}

        const socialLinks = await prisma.socialLink.create({
            data: {
                platform,
                link,
                profileId: profile.id
            }
        });

        res.status(201).json({message: "Social Links created successfully", socialLinks});
    } catch (error : any) {
        res.status(500).json({ message: error.message});
    }
});


router.put('/me/social-links/:id', async(req, res)=> {
    try {
        const { platform, link } = req.body;

        const profile = await prisma.profile.findUnique({
            where: {userId: (req as any).userId}
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found"})};

        const socialLinks = await prisma.socialLink.update({
            where: { id: req.params.id},
            data: {
                platform,
                link,
                profileId: profile.id
            }
        });
        res.status(201).json({message: "Social Links updated successfully", socialLinks});
    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
});


router.delete('/me/social-links/:id', async(req, res)=> {
    try {
        await prisma.socialLink.delete({
            where: { id: (req as any).params.id}
        });
        res.json({ message: "Social link deleted successfully"})
    } catch (error : any) {
        res.status(500).json({message: error.message});
    } 
});


router.get('/me/skills', async(req, res)=> {
    try {
        const { skillIds } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found"})};

        const profileSkills = await Promise.all(
            skillIds.map((skillId: number) => {
                prisma.profileSkill.upsert({
                    where: {
                        profileId_skillId: {
                            profileId: profile.id,
                            skillId
                        }
                    },
                    update: {},
                    create: {
                        profileId: profile.id,
                        skillId
                    }
                });
            })
        );

        res.status(201).json({ message: 'Skills added successfully', profileSkills});
    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
});

router.put('/me/skills/:skillId', async(req, res)=> {
    try {
        const { skillIds, skill } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId}
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found"})};

        const profileSkills = await Promise.all(
            skillIds.map((skillId: number)=> {
                prisma.profileSkill.upsert({
                    where: {
                        profileId_skillId: {
                            profileId: profile.id,
                            skillId
                        },
                        update: {
                            profileId: profile.id,
                            skillId: skill
                        }
                    }
                });
            })
        );
        res.status(201).json({message: "Skills updated successfully", profileSkills});
    } catch (error : any) {
        res.status(500).json({ message: error.message});
    }
});

router.delete('/me/skills/:skillId', async(req, res)=> {
    try {
        await prisma.profileSkills.delete({
            where: { id: (req as any).params.skillId }

        })
        res.json({message: "Skill deleted successfully"});
    } catch (error : any) {
        res.status(500).json({ message: error.message })
    }
});

export default router;

