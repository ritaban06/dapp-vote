import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import your contract ABI
import VotingSystemABI from './VotingSystem.json';

export const EthereumContext = createContext();

export const EthereumProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);

          const signer = await provider.getSigner();
          setSigner(signer);

          const account = await signer.getAddress();
          setAccount(account);

          // Ensure the contract address is correctly formatted
          const contractAddress = '0x89Da4a651Bd38FE9EA09b149eeA5B98e1f79C279'.trim();
          if (!ethers.isAddress(contractAddress)) {
            throw new Error('Invalid contract address');
          }

          const contract = new ethers.Contract(contractAddress, VotingSystemABI.abi, signer);
          setContract(contract);

          window.ethereum.on('accountsChanged', async (accounts) => {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
            setAccount(accounts[0]);
            
            const updatedContract = new ethers.Contract(contractAddress, VotingSystemABI.abi, newSigner);
            setContract(updatedContract);
          });

        } catch (error) {
          console.error("An error occurred while initializing the Ethereum context:", error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  return (
    <EthereumContext.Provider value={{ provider, signer, contract, account }}>
      {children}
    </EthereumContext.Provider>
  );
};