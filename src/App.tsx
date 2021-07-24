import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.less';

import Shell from './components/shell/Shell';



function App() {

  const electronWindow = useCallback(() => {
    return window.ark.random.print();
    window.ark.collection.list();
  }, []);

  const [print, setPrint] = useState('');

  useEffect(() => {
    electronWindow().then((val: string) => {
      setPrint(val);
    })
  }, [])
  
  return (
    <div className="App">
      {/* <Shell
        onExecute={code => {
          console.log("Code to be executed:");
          console.log(code);
        }}
        collections={["test_collection_list_1", "test_collection_list_2"]}
      /> */}
      <p>{print}</p>
    </div>
  );
}

export default App;
