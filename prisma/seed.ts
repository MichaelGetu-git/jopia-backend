import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
    await prisma.role.createMany({
        data: [
            {id: 1, name: 'user'},
            { id: 2, name: 'companyAdmin'},
            { id: 3, name: 'recruiter'},
            { id: 4, name: 'superAdmin'}
        ],
        skipDuplicates: true,
    });
    console.log('Seeded roles successfully');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    })