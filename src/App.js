import React from 'react';
import FilePreviewer from './FilePreviewer';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
    <div className="App">
      <h1>Document Preview & Text Extractor</h1>
      <FilePreviewer />
    </div>
  );
}

export default App;
