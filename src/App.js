import React from 'react';
import { EthereumProvider } from './EthereumContext';
import TodoList from './Vote';

const App = () => {
  return (
    <EthereumProvider>
      <TodoList />
    </EthereumProvider>
  );
};

export default App;