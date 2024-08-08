import Web3Library from "web3";
const web3 = new Web3Library();

// Arguments : privateKey, message
const privateKey = process.argv[2];
const message = process.argv[3];

(async () => {
  try {
    const signature = await web3.eth.accounts.sign(message, privateKey);
    console.log(signature.signature);
  } catch (error) {
    console.error("Error signing message:", error);
  }
})();
