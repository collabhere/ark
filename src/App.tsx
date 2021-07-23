import React from 'react';
import './App.less';

import Shell from './components/shell/Shell';

function App() {
  return (
    <div className="App">
      <Shell
        onExecute={code => {
          console.log("Code to be executed:");
          console.log(code);
        }}
        collections={["test_collection_list_1", "test_collection_list_2"]}
      />
    </div>
  );
}

export default App;
