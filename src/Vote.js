import React, { useState, useEffect, useContext, useCallback } from 'react';
import { EthereumContext } from './EthereumContext';
import { Button, Input, List, message, Spin, Typography } from 'antd';
import { ethers } from 'ethers';

const { Title, Text } = Typography;

const Vote = () => {
  const { contract, account } = useContext(EthereumContext);
  const [candidates, setCandidates] = useState([]);
  const [newCandidate, setNewCandidate] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [votingStatus, setVotingStatus] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCandidates = useCallback(async () => {
    if (contract) {
      try {
        setLoading(true);
        const candidateCount = await contract.getCandidateCount();
        const loadedCandidates = await Promise.all(
          Array(candidateCount.toNumber())
            .fill()
            .map(async (_, i) => {
              const candidate = await contract.candidates(i);
              return { 
                id: i, 
                name: candidate.name, 
                voteCount: candidate.voteCount.toNumber() 
              };
            })
        );
        setCandidates(loadedCandidates);
      } catch (error) {
        console.error("Error loading candidates:", error);
        message.error('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    }
  }, [contract]);

  const checkVotingStatus = useCallback(async () => {
    if (contract) {
      try {
        const status = await contract.getVotingStatus();
        setVotingStatus(status);
      } catch (error) {
        console.error("Error checking voting status:", error);
        message.error('Failed to check voting status');
      }
    }
  }, [contract]);

  useEffect(() => {
    loadCandidates();
    checkVotingStatus();
  }, [contract, loadCandidates, checkVotingStatus]);

  const addCandidate = async () => {
    if (contract && newCandidate.trim()) {
      try {
        setLoading(true);
        const tx = await contract.addCandidate(newCandidate.trim());
        await tx.wait();
        message.success('Candidate added successfully');
        setNewCandidate('');
        loadCandidates();
      } catch (error) {
        console.error("Error adding candidate:", error);
        message.error('Failed to add candidate: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const registerVoter = async () => {
    if (contract && voterAddress) {
      try {
        setLoading(true);
        const trimmedAddress = voterAddress.trim();
        if (!ethers.isAddress(trimmedAddress)) {
          throw new Error('Invalid voter address');
        }
        const tx = await contract.registerVoter(trimmedAddress);
        await tx.wait();
        message.success('Voter registered successfully');
        setVoterAddress('');
      } catch (error) {
        console.error("Error registering voter:", error);
        message.error('Failed to register voter: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const castVote = async () => {
    if (contract && selectedCandidate !== null) {
      try {
        setLoading(true);
        const tx = await contract.vote(selectedCandidate);
        await tx.wait();
        message.success('Vote cast successfully');
        loadCandidates();
        setSelectedCandidate(null);
      } catch (error) {
        console.error("Error casting vote:", error);
        message.error('Failed to cast vote: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getWinner = async () => {
    if (contract) {
      try {
        setLoading(true);
        const result = await contract.getWinner();
        setWinner({ name: result[0], voteCount: result[1].toNumber() });
      } catch (error) {
        console.error("Error getting winner:", error);
        message.error('Failed to get winner: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <Title level={2}>Voting System</Title>
        <Text>Connected Account: {account}</Text>
        
        <Title level={3}>Add Candidate</Title>
        <Input 
          value={newCandidate} 
          onChange={(e) => setNewCandidate(e.target.value)} 
          placeholder="Candidate Name" 
          style={{ marginBottom: '10px' }}
        />
        <Button onClick={addCandidate} disabled={!newCandidate.trim()}>Add Candidate</Button>

        <Title level={3}>Register Voter</Title>
        <Input 
          value={voterAddress} 
          onChange={(e) => setVoterAddress(e.target.value)} 
          placeholder="Voter Address (0x...)" 
          style={{ marginBottom: '10px' }}
        />
        <Button onClick={registerVoter} disabled={!voterAddress.trim() || !ethers.isAddress(voterAddress.trim())}>Register Voter</Button>

        <Title level={3}>Candidates</Title>
        <List
          dataSource={candidates}
          renderItem={(candidate) => (
            <List.Item>
              <Text>{candidate.name} - Votes: {candidate.voteCount}</Text>
              <Button 
                onClick={() => setSelectedCandidate(candidate.id)} 
                disabled={!votingStatus}
                type={selectedCandidate === candidate.id ? 'primary' : 'default'}
              >
                Select
              </Button>
            </List.Item>
          )}
        />

        <Button 
          onClick={castVote} 
          disabled={selectedCandidate === null || !votingStatus}
          style={{ marginTop: '20px' }}
        >
          Cast Vote
        </Button>

        <Title level={3}>Voting Status: {votingStatus ? 'Open' : 'Closed'}</Title>

        <Button onClick={getWinner} disabled={votingStatus}>Get Winner</Button>
        {winner && (
          <div style={{ marginTop: '20px' }}>
            <Title level={3}>Winner</Title>
            <Text>{winner.name} with {winner.voteCount} votes</Text>
          </div>
        )}
      </div>
    </Spin>
  );
};

export default Vote;