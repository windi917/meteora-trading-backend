const { PrismaClient, ProposalStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function init() {
    const startAt = new Date();
    const endAt = new Date();
    endAt.setFullYear(2050);
    endAt.setMonth(1);
    endAt.setDate(1);
    const votingPeriod = await prisma.votingPeriod.create({
        data: { 
            startAt: startAt.toISOString(), 
            endAt: endAt.toISOString(), 
            votingtitle: "INITIAL", 
            votePowerLimit: 0 
        }
    });
};

init()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });