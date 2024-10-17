// src/components/Dashboard/Card.jsx

import React from 'react';
import './card.css';

const Card = ({ title, icon, children }) => {
  return (
    <div className='card'>
      <div className='card-header'>
        <i className={`${icon} card-icon`}></i>
        <h5 className='card-title'>{title}</h5>
      </div>
      <div className='card-body'>{children}</div>
    </div>
  );
};

export default Card;
