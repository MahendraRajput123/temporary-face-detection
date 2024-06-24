import React from 'react';
import FaceRecognisation from './components/faceRecognisation/Main.jsx';
import { BrowserRouter, Routes, Route } from "react-router-dom";
const App = () => {
 
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FaceRecognisation />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;