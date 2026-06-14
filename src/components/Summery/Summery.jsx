import React from 'react'
import { Link, useLocation,useNavigate } from "react-router-dom";
import './Summery.css'

export default function Summary(props) {
  const { state } = useLocation();
  const { movie} = state;

  const navigate = useNavigate()

    function handleBookNow() {
       const movieName = movie.show.name;
        navigate(`/book-ticket/Bookingform`, { state: { movieName } })
    }

  return (
    <div>
      <div className='container'>
      <Link to='/'><button style={{borderRadius:"40px"}} className='btn btn-primary my-2'>Go To Home</button></Link>
      <h2 className='text-center' style={{color:"white"}}>Summary of Movie</h2><hr />

        <div className="summary-card">
          
          
          <div className="user-info">
          <img alt="" className="summery-img"
          src={movie.show.image.original} />
            
          </div>
          <div className="Description "style={{color:"white"}}>
          <p>Name : {movie.show.name}</p><br />
            <p>Language: {movie.show.language}</p><br />
            <p>Rating: {movie.show.rating.average}</p><br />
            <h3>Description</h3>
          <div style={{color:"white"}} dangerouslySetInnerHTML={{ __html: movie.show.summary }}></div>
            <button onClick={handleBookNow} style={{borderRadius:"40px"}} className="ticket-booking-btn btn btn-primary m-3" type="button">Book TIcket</button>
          
      </div>
      </div>
            
      
  </div>
  </div>
  )
}
