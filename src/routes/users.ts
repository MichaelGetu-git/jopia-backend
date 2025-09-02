import express from 'express'
import prisma from '../prismaClient'

const router = express.Router();

router.get('/me', async (req, res)=> {
    try {
       const user = await prisma.user.findUnique({
        where: {id: (req as any).user.id},
        select: {
            id: true,
            email: true,
            roleId: true,
            profile: {
                select: {
                    name: true,
                    phone: true,
                    profilePicture: true,
                    coverPicture: true,
                    location: true,
                    bio: true,
                    aboutMe: true,
                }
            }
        }
       });
       
       if (!user) return res.status(404).json({message: 'User not found'});

       res.json(user);
    } catch(error: any) {
        res.status(500).json({message: error.message});
    }
});

router.put('/me', async (req, res)=> {
    try {
        const { name, phone, profilePicture, coverPicture, location, bio, aboutMe } = req.body;

        const updatedProfile = await prisma.profile.upsert({
            where: { userId: (req as any).user.id},
            update: { name, phone, profilePicture, coverPicture, location, bio, aboutMe },
            create: {
                userId: (req as any).user.id,
                name,
                phone,
                profilePicture,
                coverPicture,
                location,
                bio,
                aboutMe
            }
        });

        res.json({message: 'Profile Updated', profile: updatedProfile});
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
});

router.get('/:id', async (req, res)=> {
    try {
        const id = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                profile: {
                    select: {
                        name: true,
                        profilePicture: true,
                        location: true,
                        bio: true
                    }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found'});

        res.json(user);
    } catch(error : any) {
        res.status(500).json({message: error.message})
    }
});

export default router;