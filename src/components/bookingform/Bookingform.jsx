import React, { useState } from 'react'
import "./Bookingform.css";
import { Link, useLocation } from "react-router-dom";

export default function Bookingform(props) {
  const { state } = useLocation();

  const { movieName } = state;

  const [userDetail, setUserDetail] = useState({
    name: "",
    email: ""
  })

  function handleChange(e) {
    setUserDetail({
        ...userDetail, [e.target.name]: e.target.value
    })
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    // Creating the Movie Booking Detail object
    let movieBookingDetail = {
      MovieName: movieName,
      userDetail
    }

    let localStorageMoviesData = localStorage.movieBookingDetail

    // Add the data to the local Stroage
    if (!localStorageMoviesData) {
      localStorage.setItem('movieBookingDetail', JSON.stringify([movieBookingDetail]));
    }
    else {
      let parseArray = JSON.parse(localStorageMoviesData)
      let newArrayStorage = [
        ...parseArray, movieBookingDetail
      ]
      localStorage.setItem('movieBookingDetail', JSON.stringify(newArrayStorage));
    }
    setUserDetail({
      name: "",
      email: ""
    })
    
    
  }
  
  return (
    <div style={{height:"100vh"}}>
    <Link to='/'><button className='btn btn-primary m-3' style={{borderRadius:"40px"}}>Go To Home</button></Link>
    <div className='container my-4 main-div' style={{color:"white"}}>
      
      <h2 style={{color:"white"}}>Book Your Ticket Now</h2>
      <form onSubmit={handleFormSubmit}>
        <div className="form-group" >
          <label htmlFor="exampleInputEmail1">Movie Name</label>
          <input type="text" className="form-control my-2 input-field" id="exampleInputName" defaultValue={movieName} aria-describedby="nameHelp" placeholder="Enter movie name" />
          <label htmlFor="exampleInputEmail1">Name</label>
          <input type="text" className="form-control my-2 input-field" required name="name" id="name" value={userDetail.name} onChange={handleChange} aria-describedby="nameHelp" placeholder="Enter your name" />
          <label htmlFor="exampleInputEmail1">Email</label>
          <input type="email" className="form-control my-2 input-field" required name="email" id="email" value={userDetail.email} onChange={handleChange} aria-describedby="emailHelp" placeholder="Enter your email" />
        </div>
        <div > <br />
        <button type="submit" style={{borderRadius:"40px"}}className="btn btn-primary">Submit</button>
        </div>
      </form>
    </div>
    </div>
  )
}