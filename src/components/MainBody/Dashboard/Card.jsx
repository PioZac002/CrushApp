import React from 'react';
import './card.css';

// const Card = ({ title, icon, children }) => {
//   return (
//     <div className='card'>
//       <div className='card-header d-flex align-items-center'>
//         <i className={`${icon} card-icon`}></i>
//         <h5 className='card-title ms-2'>{title}</h5>
//       </div>
//       <div className='card-body'>
//         {children}
//         <h5 className='card-title'></h5>
//       </div>
//     </div>
//   );
// };

// export default Card;

const Card = ({ title, icon, children }) => {
  return (
    <div className='card'>
      <div className='card-header d-flex align-items-center'>
        <i className={`${icon} card-icon`}></i>
        <h5 className='card-title ms-2'>{title}</h5>
      </div>
      <div className='card-body'>{children}</div>
    </div>
  );
};

export default Card;
