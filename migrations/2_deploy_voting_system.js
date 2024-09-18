const VotingSystem = artifacts.require("VotingSystem");

   module.exports = function(deployer) {
     const votingDurationInMinutes = 1440; // 24 hours
     deployer.deploy(VotingSystem, votingDurationInMinutes);
   };