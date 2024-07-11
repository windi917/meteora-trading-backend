const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

// createUser function
exports.createUser = async ({address, freeVote}) => {
    const newUser = await prisma.user.create({
      data : {
        address: address,
        freeVote: freeVote
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
      include: {
        tokens: true,
        tickets: true,
        votes: true
      }
    })
  }
  // updateUser function
  exports.updateUser = async (userId, name, email, address) => {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name : name,
        email : email,
        address : address
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
        include: {
            tokens: true,
            votes: true
          }
    });    
    return user;
};