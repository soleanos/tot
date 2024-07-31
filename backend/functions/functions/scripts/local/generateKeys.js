import Web3Library from "web3";
const web3 = new Web3Library();

const account = web3.eth.accounts.create();

console.log(
  JSON.stringify({
    address: account.address,
    privateKey: account.privateKey,
  }),
);
