import express from 'express'
import prisma from '../prismaClient.ts'
import multer from 'multer';
import cloudinary from 'cloudinary';

const router = express.Router();
const upload = multer({ dest: 'uploads/ '});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get('/me', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: (req as any).userId },
            include: {
                role: true,
                profile: true,
                jobApplications: true,
                savedJobs: true,
                jobViews: true
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/me', upload.fields([
    { name: 'coverPicture', maxCount: 1},
    { name: 'profilePicture', maxCount: 1}
]), async (req, res) => {
    
    let coverUrl = null;
    let profileUrl = null;

    try {
        
        if (req.files && !Array.isArray(req.files)) {
            const coverFile = req.files!['coverPicture']?.[0];
            const profileFile = req.files!['profilePicture']?.[0];

            if (coverFile) {
                const coverResult = await cloudinary.v2.uploader.upload(coverFile.path, {
                    folder: 'profile_covers',
                });
                coverUrl = coverResult.secure_url;
            }

            if (profileFile) {
                const profileResult = await cloudinary.v2.uploader.upload(profileFile.path, {
                    folder: 'profile_pics',
                });
                profileUrl = profileResult.secure_url;
            }
        }
        
    } catch (error : any ) {
        res.status(500).json({ message: error.message})
    }
    try {
        const { name, phone,profilePicture, coverPicture, location, aboutMe, bio, currJobLocation } = req.body;

        const profile = await prisma.profile.upsert({
            where: { userId: (req as any).userId },
             update: {
                name,
                phone,
                profilePicture: profileUrl,
                coverPicture: coverUrl,
                location,
                aboutMe,
                bio,
                currJobLocation
            },
            create: {
                userId: (req as any).userId,
                name,
                phone,
                profilePicture: profileUrl,
                coverPicture: coverUrl,
                location,
                aboutMe,
                bio,
                currJobLocation
            }
        });

        res.json({ message: 'Profile Updated successfully', profile });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});



router.put('/me', upload.fields([
    { name: 'coverPicture', maxCount: 1},
    { name: 'profilePicture', maxCount: 1}
]), async (req, res) => {
    
    let coverUrl = null;
    let profileUrl = null;

    try {
        
        if (req.files && !Array.isArray(req.files)) {
            const coverFile = req.files!['coverPicture']?.[0];
            const profileFile = req.files!['profilePicture']?.[0];

            if (coverFile) {
                const coverResult = await cloudinary.v2.uploader.upload(coverFile.path, {
                    folder: 'profile_covers',
                });
                coverUrl = coverResult.secure_url;
            }

            if (profileFile) {
                const profileResult = await cloudinary.v2.uploader.upload(profileFile.path, {
                    folder: 'profile_pics',
                });
                profileUrl = profileResult.secure_url;
            }
        }
        
    } catch (error : any ) {
        res.status(500).json({ message: error.message})
    }
    try {
        const { name, phone,profilePicture, coverPicture, location, aboutMe, bio, currJobLocation } = req.body;

        const profile = await prisma.profile.update({
            where: { userId: (req as any).userId },
            data: {
                name,
                phone,
                profilePicture: profileUrl,
                coverPicture: coverUrl,
                location,
                aboutMe,
                bio,
                currJobLocation
            }
        });

        res.json({ message: 'Profile Updated successfully', profile });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const profile = await prisma.profile.findUnique({
            where: { id: id },
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
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
});


router.post('/me/educations', async (req, res) => {
    try {
        const { uniName, degreeLevel, startYear, endYear, field, description } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId },
        });

        if (!profile) { return res.status(404).json({ message: 'Profile not found' }); }

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

        res.status(201).json({ message: 'Education added succesfully', education });
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
});

router.put('/me/educations/:id', async (req, res) => {
    try {
        const { uniName, degreeLevel, startYear, endYear, field, description } = req.body

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        const educations = await prisma.education.update({
            where: { id: parseInt(req.params.id) },
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

        res.json({ message: 'Educations updated successfully', educations })
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/me/educations/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)

        await prisma.education.delete({
            where: { id: id }
        });

        res.json({ message: "Education deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: error.message })
    }
})


router.post('/me/experiences', async (req, res) => {
    try {
        const { jobTitle, jobTypeId, startTime, endTime, description } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' })
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

        res.status(201).json({ message: 'Experience added successfuly', experience });
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
});

router.put('/me/experiences/:id', async (req, res) => {
    try {
        const { jobTitle, jobTypeId, startTime, endTime, description } = req.body;
        const id = parseInt(req.params.id);
        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        const experience = await prisma.experience.update({
            where: { id: id },
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

        res.status(201).json({ message: 'Experiences updated successfully', experience })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})


router.delete('/me/experiences/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        await prisma.experience.delete({
            where: { id: id }
        });

        res.json({ message: "Experience deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/me/portfolios',upload.single('resume'), async (req, res) => {
    let resumeUrl = null;
    try {
        const { resume, portfolioLink } = req.body

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found" }) };

        if (req.file && req.file.mimetype !== 'application/pdf') {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'resumes',
            });
            resumeUrl = result.secure_url;
        }
        const portfolio = await prisma.portfolio.create({
            data: {
                resume: resumeUrl,
                portfolioLink,
                profileId: profile.id
            }
        });
        res.status(201).json({ message: "Portfolio created successfully", portfolio });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.put('/me/portfolios/:id',upload.single('resume') ,async (req, res) => {
    let resumeUrl = null;
    try {
        const { resume, portfolioLink } = req.body;
        const id = parseInt(req.params.id);
        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found" }) };

        if (req.file && req.file.mimetype !== 'application/pdf') {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'resumes',
            });
            resumeUrl = result.secure_url;
        }
        const portfolio = await prisma.portfolio.update({
            where: { id: id },
            data: {
                resume: resumeUrl,
                portfolioLink,
                profileId: profile.id
            }
        });
        res.status(201).json({ message: "Portfolio updated successfully", portfolio })
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.delete('/me/portfolios/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    try {
        await prisma.portfolio.delete({
            where: { id: id }
        });
        res.json({ message: "Portfolio deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/me/social-links', async (req, res) => {
    try {
        const { platform, link } = req.body

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "profile not found" }) }

        const socialLinks = await prisma.socialLink.create({
            data: {
                platform,
                link,
                profileId: profile.id
            }
        });

        res.status(201).json({ message: "Social Links created successfully", socialLinks });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.put('/me/social-links/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { platform, link } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found" }) };

        const socialLinks = await prisma.socialLink.update({
            where: { id: id },
            data: {
                platform,
                link,
                profileId: profile.id
            }
        });
        res.status(201).json({ message: "Social Links updated successfully", socialLinks });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.delete('/me/social-links/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        await prisma.socialLink.delete({
            where: { id: id }
        });
        res.json({ message: "Social link deleted successfully" })
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/me/skills', async (req, res) => {
    try {
        const { skillIds } = req.body;

        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found" }) };

        const profileSkills = await Promise.all(
            skillIds.map((skillId: number) => {
                return prisma.profileSkill.upsert({
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

        res.status(201).json({ message: 'Skills added successfully', profileSkills });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/me/skills/:skillId', async (req, res) => {
    try {
        const { skillIds } = req.body;
        const skill = parseInt(req.params.skillId);
        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });

        if (!profile) { return res.status(404).json({ message: "Profile not found" }) };

        const profileSkills = await Promise.all(
            skillIds.map((skillId: number) => {
                return prisma.profileSkill.upsert({
                    where: {
                        profileId_skillId: {
                            profileId: profile.id,
                            skillId
                        },

                    },
                    update: {
                        profileId: profile.id,
                        skillId: skill
                    },
                    create: {
                        profileId: profile.id,
                        skillId: skill
                    }
                });
            })
        );
        res.status(201).json({ message: "Skills updated successfully", profileSkills });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/me/skills/:skillId', async (req, res) => {
    const skillId = parseInt(req.params.skillId)
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: (req as any).userId }
        });
        await prisma.profileSkill.delete({
            where: {
                profileId_skillId: {
                    profileId: profile!.id,
                    skillId: skillId
                }
            }

        })
        res.json({ message: "Skill deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
});

export default router;

