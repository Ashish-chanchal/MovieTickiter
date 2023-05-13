import React, { useState } from 'react'
import LoadingBar from 'react-top-loading-bar'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  // Link
} from "react-router-dom";
import './App.css';
import Navbar from './components/Navbar';
import Movies from './components/allmovies/Moviecon';

import Summery from './components/Summery/Summery';
import Bookingform from './components/bookingform/Bookingform';



function App() {
  const [smode, setmode] = useState("light");
  
  const toggleMode=()=>{
    if(smode==="light"){

      setmode("dark");
      document.body.style.backgroundColor ='grey';
      
      
    }
    else{
      setmode("light");
      document.body.style.backgroundColor ='white';
     
      
    }
  }
  const [progress, setProgress] = useState(100)

  return (
    < div style={{backgroundColor:"black"}}>
       <Router>
    <Navbar title="Movies Show" mode={smode} toggle={toggleMode} />
    <LoadingBar
    height={4}
        color='black'
        progress={progress}
        onLoaderFinished={() => setProgress(100)}
      />
 
      <Routes>
      <Route exact  path='/' element={<Movies  mode={smode}/>} />
      <Route exact  path='/summery/:id' element={<Summery mode={smode}/> } />
      <Route exact path='/book-ticket/Bookingform' element={<Bookingform mode={smode}/>} />
      </Routes>
      </Router>
      
     
    </div>
  );
}

export default App;
