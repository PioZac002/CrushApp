import './searchBar.css';
const SearchBar = () => {
  return (
    <div className='search-bar'>
      <form
        action='#'
        className='search-form d-flex align-items-center'
        method='POST'
      >
        <input
          type='text'
          title='Enter search keyword'
          placeholder='Search...'
          name='query'
        />
        <button type='submit' title='Search'>
          <i className='bi bi-search'></i>
        </button>
      </form>
    </div>
  );
};
export default SearchBar;
