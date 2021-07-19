import {ethers, Signer} from 'ethers';

function constructPaymentMessage(contractAddress:string, amount:string){
  return ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [contractAddress, amount]);
}


function signMessage(message:string, signer: Signer){
  return signer.signMessage(ethers.utils.arrayify(message));
}


export function signPayment(contractAddress:string, amount:string, signer:Signer){
  let message = constructPaymentMessage(contractAddress, amount);
  console.log('message: ', message);
  return signMessage(message, signer);
}




// init provider and signer
// const provider = ethers.getDefaultProvider();
// const signer:Signer = ethers.Wallet.createRandom();

// signPayment('0x2f0244870b53f8b98F07eB3fCeE00f5912CBe4F9', 1000, signer).then(
  // (message: string)=>{
  // console.log(message);
// });
