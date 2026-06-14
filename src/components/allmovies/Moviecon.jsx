import React, { useState, useEffect } from 'react'
import Slider from '../slider/Slider';
import Movies from '../movies/Movies';
import './moviecon.css';

export default function Content(props) {
 
  const [movieData, setMovieData] = useState([]);

  const apiData = async () => {
    
      const response = await fetch('https://api.tvmaze.com/search/shows?q=all');
      const jsonData = await response.json();
      setMovieData(jsonData);

  }
  apiData();
  useEffect(() => {
    apiData();
  }, []);


  return (
    <>
    <Slider />
    <div>
      <h1 className="heading" style={{color:"white"}}>Movies</h1><hr />

      <div className="container">
        <div className="row">
          {movieData.map((movieItem) => {
            return <div className="col-md-4" key={movieItem.show.url}>
              <Movies movie={movieItem} name={movieItem.show.name} language={movieItem.show.language} image={!movieItem.show.image ? "Not image found" : movieItem.show.image.original}  id={movieItem.show.id} date={movieItem.show.premiered} />
            </div>
          })}
        </div>
      </div>
    </div>
    </>
  )
}