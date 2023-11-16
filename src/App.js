import logo from "./logo.svg";
import "./App.css";
import { TextField, Button, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import web3 from "./web3";
import axios from "axios";
import { BrowserProvider } from "ethers";
import { Buffer } from "buffer";
import { contract } from "./contract";
// import { hashPersonalMessage, toBuffer } from 'ethereumjs-util';
// import { contract } from "./contract";
// import { keccak256, ethers } from 'ethers';
const ethers = require("ethers");

const Wallet = () => {
  const [txData, setTxData] = useState({ address: "", amount: "" });
  const [accountAddress, setAccountAddress] = useState("");
  const [txHash, setTxHash] = useState("");

  const { ethereum } = window;


  const connectWallet = async () => {
    console.clear();
    const { ethereum } = window;
    if (!ethereum) {
      // sethaveMetamask(false);
    }

    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    const chainId = await ethereum.request({
      method: "eth_chainId",
    });

    console.log("accounts", accounts);
    console.log("chain id", chainId);
    setAccountAddress(accounts[0]);
  };

  async function signTransaction() {
    console.log("sign tx karao", txData);
    const accounts = await web3.eth.getAccounts();
    const fromAddress = accounts[0]; // The current MetaMask account
    const contractAddress = "0xE78ef47FeEDf1e472C21B9781E83F7A45e1a8C36";
    console.log("from address", fromAddress);

    const nonce = await contract.methods.nonce(fromAddress).call({
      from: fromAddress,
    });
    console.log("nonce", Number(nonce), nonce);


    try {
      const DomainSeparator = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "address"],
          ["0x01", contractAddress]
        )
      );
      console.log("domain seperator", DomainSeparator);

      const message = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "address", "uint256", "uint256"],
          [
            fromAddress,
            txData.address, // to address
            txData.amount, // amount
            Number(nonce),
          ]
        )
      );

      console.log("message length", message.length);

      let finalHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes1", "bytes1", "bytes32", "bytes32"],
          ["0x19", "0x01", DomainSeparator, message]
        )
      );

      console.log("final hash", finalHash);

      // waleed wala code
      const signature = await web3.eth.personal.sign(
        finalHash,
        fromAddress,
        ""
      );

      console.log("signature", signature);

      const result = await axios.post("https://zero-project-production.up.railway.app/submitSig", {
        from: fromAddress, // from
        to: txData.address, // to
        amount: txData.amount,
        signature,
      });
      console.log("result", result.data.hash);
      setTxHash(result.data.hash);
    } catch (error) {
      alert("Request failed!");
      console.error("Transaction signing failed:", error);
    }
  }


  const getFunds = async () => {
    console.log("get funds");
    const result = await axios.put("https://zero-project-production.up.railway.app/getFunds", {
      recipient: accountAddress,
      amount: web3.utils.toWei("100", "ether"),
    });
    console.log('result', result);
  };


  return (
    <div style={{ paddingLeft: "1rem", paddingTop: "1rem" }}>
      <Typography>{accountAddress}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={2}>
          <Button
            variant="contained"
            disabled={accountAddress}
            onClick={connectWallet}
          >
            Connect
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            disabled={!accountAddress}
            onClick={getFunds}
          >
            Get funds
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TextField
            // className={classes.textField}
            label="Address"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            style={{
              width: 420,
              paddingRight: 15,
            }}
            onChange={(e) => {
              setTxData({
                ...txData,
                address: e.target.value,
              });
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            // className={classes.textField}
            label="Amount"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            type="number"
            onChange={(e) => {
              setTxData({
                ...txData,
                amount: e.target.value,
              });
            }}
          />
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            disabled={!accountAddress}
            onClick={signTransaction}
          >
            Send
          </Button>
        </Grid>

        <Grid item xs={2}>
          {txHash && <Typography>Tx Hash {txHash}</Typography>}
          {/* <Button variant="contained" disabled={!accountAddress} onClick={signTransaction}>
            Send
          </Button> */}
        </Grid>

        {/* <Grid item xs={12}>
          <Button variant="contained" onClick={testFunc}>
            Test
          </Button>
        </Grid> */}
      </Grid>
    </div>
  );
};

function App() {
  return <Wallet />;
}

export default App;
