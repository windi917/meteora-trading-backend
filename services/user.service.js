const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

// createUser function
exports.createUser = async ({address, freeVote}) => {
    const newUser = await prisma.user.create({
      data : {
        address: address,
      }
    }).catch((e) => {
      console.error(e)
    })
    return newUser;
  }
  // GetUser function
  exports.getUser = async (userId) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
  }
  // deleteUser function
  exports.deleteUser = async (userId) => {
    const user = await prisma.user.delete({
      where: {
        id: userId,
      },
    })
  }

exports.getUserByAddress = async (address) => {
    const user = await prisma.user.findUnique({
        where: {
            address: address
        },
    });    
    return user;
};