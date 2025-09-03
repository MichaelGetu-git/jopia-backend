import type { Request, Response, NextFunction } from "express";
import express from 'express';
import jwt from 'jsonwebtoken'


export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({message: 'No token provided'});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {id: number};
        (req as any).user = decoded;
        next();
    } catch {
        return res.status(403).json({message: 'Invalid or expired token'});
    }
};

