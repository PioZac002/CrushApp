// src/components/Common/ListWithToggle.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ListWithToggle = ({ items, renderItem, maxVisible }) => {
  const [showAll, setShowAll] = useState(false);

  const handleToggle = () => {
    setShowAll((prev) => !prev);
  };

  const visibleItems = showAll ? items : items.slice(0, maxVisible);

  return (
    <div>
      <ul className='list-group'>{visibleItems.map(renderItem)}</ul>
      {items.length > maxVisible && (
        <button className='btn btn-primary mt-2' onClick={handleToggle}>
          {showAll ? 'Pokaż mniej' : 'Pokaż więcej'}
        </button>
      )}
    </div>
  );
};

ListWithToggle.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  maxVisible: PropTypes.number,
};

ListWithToggle.defaultProps = {
  maxVisible: 5,
};

export default ListWithToggle;
