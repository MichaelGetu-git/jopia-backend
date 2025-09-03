import express from 'express';
import { authenticate } from './middleware/authentication.ts';
import admin from './routes/admin.ts'
import profile from './routes/profiles.ts'
import auth from './routes/auth.ts'
import skills from './routes/skills.ts'
import companies from './routes/companies.ts'
import jobs from './routes/jobs.ts'
import applications from './routes/applications.ts'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use("/admin", authenticate, admin)
app.use("/applications", authenticate, applications)
app.use("/auth", auth)
app.use("/jobs", authenticate, jobs)
app.use("/skills", authenticate, skills)
app.use("/profile",authenticate, profile)
app.use("/companies", authenticate, companies)

app.listen(port, ()=> {
    console.log(`Port listening on port ${port}`)
})