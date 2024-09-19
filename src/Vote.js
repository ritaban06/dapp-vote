import React, { useContext, useState, useEffect, useCallback } from 'react';
import { EthereumContext } from './EthereumContext';

const Vote = () => {
  const { contract, account } = useContext(EthereumContext);
  const [state, setState] = useState({
    candidateName: '',
    candidates: [],
    votingStatus: false,
    error: null,
    winner: null,
    isOwner: false,
    isLoading: true,
  });

  const updateState = (newState) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  };

  const checkWinner = useCallback(async () => {
    if (!contract) return;
    try {
      const { winnerName, winningVoteCount } = await contract.getWinner();
      updateState({
        winner: { name: winnerName, votes: winningVoteCount.toString() }
      });
    } catch (error) {
      if (!error.message.includes("Voting has not ended yet")) {
        console.error("Failed to get winner:", error);
      }
    }
  }, [contract]);

  const fetchContractData = useCallback(async () => {
    if (!contract || !account) {
      console.log("Contract or account not available");
      return;
    }

    try {
      updateState({ isLoading: true });

      console.log("Fetching contract data...");

      const [candidateCount, votingStatus, owner] = await Promise.all([
        contract.getCandidateCount(),
        contract.getVotingStatus(),
        contract.owner(),
      ]);

      console.log("Candidate count:", candidateCount.toString());
      console.log("Voting status:", votingStatus);
      console.log("Contract owner:", owner);

      console.log("Fetching candidates...");
      const candidates = await Promise.all(
        Array.from({ length: candidateCount.toNumber() }, async (_, i) => {
          const candidate = await contract.candidates(i);
          console.log(`Candidate ${i}:`, candidate);
          return {
            id: i,
            name: candidate.name,
            voteCount: candidate.voteCount.toString()
          };
        })
      );

      console.log("All candidates:", candidates);

      updateState({
        candidates,
        votingStatus,
        isOwner: owner.toLowerCase() === account.toLowerCase(),
        isLoading: false,
      });

      if (!votingStatus) {
        console.log("Checking winner...");
        await checkWinner();
      }

      console.log("Contract data fetched successfully");
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      updateState({
        error: `Failed to load contract data: ${error.message}. Please check your connection and try again.`,
        isLoading: false,
      });
    }
  }, [contract, account, checkWinner]);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  const handleInputChange = (e) => {
    updateState({ candidateName: e.target.value });
  };

  const addCandidate = async () => {
    if (!contract || !state.isOwner || state.votingStatus) {
      updateState({
        error: "Cannot add candidate. Check your permissions and voting status."
      });
      return;
    }

    try {
      const tx = await contract.addCandidate(state.candidateName);
      await tx.wait();
      updateState({ candidateName: '', error: null });
      fetchContractData();
    } catch (error) {
      console.error("Failed to add candidate:", error);
      updateState({
        error: `Failed to add candidate: ${error.message}`
      });
    }
  };

  const castVote = async (candidateId) => {
    if (!contract || !state.votingStatus) {
      updateState({
        error: "Cannot cast vote. Check voting status and your connection."
      });
      return;
    }

    try {
      const tx = await contract.vote(candidateId);
      await tx.wait();
      updateState({ error: null });
      fetchContractData();
    } catch (error) {
      console.error("Failed to cast vote:", error);
      updateState({
        error: `Failed to cast vote: ${error.message}`
      });
    }
  };

  const registerVoter = async () => {
    if (!contract || !state.isOwner || !account) {
      updateState({
        error: "Cannot register voter. Check your permissions and connection."
      });
      return;
    }

    try {
      const tx = await contract.registerVoter(account);
      await tx.wait();
      updateState({ error: null });
      fetchContractData();
    } catch (error) {
      console.error("Failed to register voter:", error);
      updateState({
        error: `Failed to register voter: ${error.message}`
      });
    }
  };

  if (state.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="vote-container">
      <h1>Voting System</h1>
      
      {account && (
        <p>Connected Account: {account} {state.isOwner && "(Contract Owner)"}</p>
      )}

      {!state.votingStatus && state.isOwner && (
        <div className="add-candidate">
          <h2>Add Candidate</h2>
          <input 
            type="text" 
            value={state.candidateName} 
            onChange={handleInputChange}
            placeholder="Enter candidate name"
          />
          <button onClick={addCandidate}>Add Candidate</button>
        </div>
      )}

      <h2>Candidates</h2>
      <div className="candidates-list">
        {state.candidates.map(candidate => (
          <div key={candidate.id} className="candidate-item">
            <span>{candidate.name} - Votes: {candidate.voteCount}</span>
            <button 
              onClick={() => castVote(candidate.id)} 
              disabled={!state.votingStatus}
            >
              Vote
            </button>
          </div>
        ))}
      </div>

      {state.isOwner && (
        <button onClick={registerVoter} className="register-voter">
          Register Current Account as Voter
        </button>
      )}

      {state.error && <p className="error-message">{state.error}</p>}
      
      <p className="voting-status">
        Voting Status: {state.votingStatus ? "Open" : "Closed"}
      </p>
      
      {state.winner && (
        <div className="winner-info">
          <h2>Winner</h2>
          <p>{state.winner.name} with {state.winner.votes} votes</p>
        </div>
      )}
    </div>
  );
};

export default Vote;