import express from 'express';
import { authenticate } from './middleware/auth';
import admin from './routes/admin'
import profile from './routes/profiles'
import auth from './routes/auth'
import skills from './routes/skills'
import companies from './routes/companies'
import jobs from './routes/jobs'
import applications from './routes/applications'

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