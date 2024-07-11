const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../services/user.service');
const nacl = require('tweetnacl');
const solanaWeb3 = require('@solana/web3.js')
var bs58 = require('bs58')

exports.signup = async (req, res, next) => {
    const {address, msg, signature} = req.body;
    try {
        //Validate whether the address of owner signed the "msg" to signature.
        // Decode base58 to a buffer        
        var bytes = bs58.decode(address);
        const buffer = Buffer.from(signature, 'base64');

        const publicKeyUintArray = Uint8Array.from(bytes);
        const signatureUintArray = Uint8Array.from(buffer);
        const messageUintArray = new Uint8Array(Buffer.from(msg));
        const valid = nacl.sign.detached.verify(messageUintArray, signatureUintArray, publicKeyUintArray);
        if(!valid){
            return res.status(402).json({"message":'The Signed Message Not Valid'});
        }        
        const user = await userService.createUser({
            address: address,
        });

        res.status(201).json(user)
    } catch (error) {
        res.status(402).json(error)
    }
}

exports.login = async (req, res, next) => {
    try {
        console.log(req.body)
        const {address} = req.body;

        let user = await userService.getUserByAddress(address);
        if(!user){
            return res.json({success: false});
        }
        
        const token = jwt.sign({ userId: user.id, walletaddress: user.address }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        const admin = JSON.parse(process.env.ADMIN_WALLET);
        let flag = false;
        for ( let i = 0; i < admin.length; i ++ )
            if ( admin[i] === user.address ) {
                flag = true;
                break;
            }

        if ( flag === true)
            role = "ADMIN";
        else role = "USER";
        
        res.json({success: true, token, userId: user.id, name: user.name, email: user.email, address: user.address, role: role});
    } catch (error) {
        next(error);
    }
}