import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import prisma from '../prismaClient'

dotenv.config();
const router = express.Router();


router.post('/register', async(req, res)=> {
    try {
        const { email, password, name, roleId = 1 } = req.body as {email: string; password: string; name: string; roleId: number};

        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) return res.status(400).json({message: 'User already exists!'});

        const hashPass = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashPass,
                roleId,
                profile: {
                    create: {
                        name
                    }
                }
            },
            include: {
                profile: true,
                role: true
            }
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, roleId: user.roleId },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({message: 'User registered', user: {id: user.id, email: user.email, role: user.role.name, profile: user.profile}, token })
    } catch (error: any) {
        res.status(500).json({message: error.message});
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body as {email: string; password: string}

        const user = await prisma.user.findUnique({
            where: {
                email
            },
            include: {
                role: true,
                profile: true
            }
        });
        if (!user) return res.status(400).json({message: "Invalid credientials"});

        const isUser = await bcrypt.compare(password, user.passwordHash);
        if (!isUser) return res.status(400).json({message: 'Invalid Credientials'});

        const token = jwt.sign(
            {id: user.id, roleId: user.roleId},
            process.env.JWT_SECRET as string,
            {expiresIn: '1h'}
        );

        res.json({
            message: 'Login Successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role.name,
                profile: user.profile
            }
        });
    } catch(error: any) {
        res.status(500).json({message: error.message})
    }
});

router.post('/logout', (_req, res)=> {
    res.json({message: 'Logged out successfullly'});
});

router.post('/forgot-password', async(req, res)=> {
    try {
        const { email } = req.body as { email: string};
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) return res.status(400).json({message: "User not found"});

        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET as string, {expiresIn: '24h'})

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS}
        });

        const resetLink = `http://localhost:3000/reset-password/${token}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset',
            text: `Click this link to reset your password: ${resetLink}`
        });

        res.json({message: 'Password reset email sent'});
    } catch( error: any) {
        res.status(500).json({message: error.message})
    }
});

router.post('/reset-password', async(req, res)=> {
    try {
        const {token, newPass} = req.body as {token: string; newPass: string; };

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {id: number};

        const hashPass = await bcrypt.hash(newPass, 10);

        await prisma.user.update({
            where: {
                id: decoded.id
            },
            data: {
                passwordHash: hashPass
            }
        });
        res.json({message: 'Password reset successful!'})
    } catch(error: any) {
        res.status(400).json({message: 'Invalid or expired token'});
    }
});

export default router;