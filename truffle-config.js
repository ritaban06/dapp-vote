module.exports = {
  networks: {
    // Your network configurations...
  },
  compilers: {
    solc: {
      version: "0.8.19",    // Match this to your contract's pragma
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};