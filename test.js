const nacl = require('tweetnacl');
const solanaWeb3 = require('@solana/web3.js')
var bs58 = require('bs58')

// Decode base58 to a buffer
var bytes = bs58.decode('7HrbNzVP63XqpuZU3x8RF77ChA2z3q1s5dBzNQv7fRaK')

// Signature generated from Solana
const signature = Buffer.from([
  171,
  174,
  152,
  226,
  24,
  47,
  223,
  48,
  168,
  79,
  229,
  143,
  15,
  202,
  69,
  199,
  21,
  98,
  113,
  26,
  254,
  221,
  184,
  38,
  23,
  50,
  37,
  183,
  57,
  144,
  193,
  66,
  13,
  236,
  80,
  144,
  124,
  139,
  34,
  176,
  195,
  105,
  79,
  133,
  69,
  71,
  13,
  217,
  38,
  29,
  39,
  150,
  18,
  42,
  166,
  25,
  140,
  233,
  113,
  2,
  24,
  122,
  4,
  13
]);
// The original message that was signed
const base64data = Buffer.from(signature).toString('base64');
const buffer = Buffer.from("q66Y4hgv3zCoT+WPD8pFxxVicRr+3bgmFzIltzmQwUIN7FCQfIsisMNpT4VFRw3ZJh0nlhIqphmM6XECGHoaaa", 'base64');
console.log(base64data,buffer);
const message = "Hello World";

const publicKeyUintArray = Uint8Array.from(bytes);
const signatureUintArray = Uint8Array.from(buffer);
const messageUintArray = new Uint8Array(Buffer.from(message));

// Verify the signature
const valid = nacl.sign.detached.verify(messageUintArray, signatureUintArray, publicKeyUintArray);

if (valid) {
  console.log("The signature is valid and matches the given public key.");
} else {
  console.log("The signature is NOT valid or does NOT match the given public key.");
}