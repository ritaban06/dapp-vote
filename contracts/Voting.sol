// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingSystem {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    address public owner;
    mapping(address => Voter) public voters;
    Candidate[] public candidates;
    uint256 public votingStart;
    uint256 public votingEnd;

    event VoterRegistered(address voter);
    event CandidateAdded(uint256 candidateId, string name);
    event VoteCast(address voter, uint256 candidateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier votingPeriod() {
        require(block.timestamp >= votingStart && block.timestamp < votingEnd, "Voting is not currently open");
        _;
    }

    constructor(uint256 _durationInMinutes) {
        owner = msg.sender;
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
    }

    function addCandidate(string memory _name) public onlyOwner {
        require(block.timestamp < votingStart, "Cannot add candidates after voting has started");
        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));
        emit CandidateAdded(candidates.length - 1, _name);
    }

    function registerVoter(address _voter) public onlyOwner {
        require(!voters[_voter].isRegistered, "Voter is already registered");
        voters[_voter].isRegistered = true;
        emit VoterRegistered(_voter);
    }

    function vote(uint256 _candidateId) public votingPeriod {
        Voter storage sender = voters[msg.sender];
        require(sender.isRegistered, "You are not registered to vote");
        require(!sender.hasVoted, "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;

        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId);
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }

    function getWinner() public view returns (string memory winnerName, uint256 winningVoteCount) {
        require(block.timestamp >= votingEnd, "Voting has not ended yet");
        
        winningVoteCount = 0;
        uint256 winningCandidateId = 0;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateId = i;
            }
        }
        
        winnerName = candidates[winningCandidateId].name;
    }
}