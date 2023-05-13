import React from 'react'
import './Movies.css';
import img from '../img/none.jpg'
import { useNavigate } from "react-router-dom";
export default function Movies(props) {
   const {movie, name, language, image, id, date  } = props;
   const navigate = useNavigate()

    function handleClick() {
        navigate(`/summery/${id}`, { state: { movie} })
    }
  return (
    <div className='user-card-container'>
      <div className="user-card">
        <img className='center' alt="" src={image==="Not image found"?img:image} />
        <div className="user-info" >
          <p style={{color:"white"}}>Name : {name}</p><br />
          <p style={{color:"white"}}>Language: {language}</p><br />
          <p style={{color:"white"}}>Date: <small >{date===null?"DD-mm-yy":date}</small></p>
        <button onClick={handleClick} style={{borderRadius:"40px"}} className="btn" type="button">View Summary</button>
        </div>
      </div>
    </div>
  )
}