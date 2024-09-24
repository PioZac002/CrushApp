const SideBarItem = ({ title, icon, targetId, subItems }) => {
  return (
    <li className='nav-item'>
      <a
        className={`nav-link ${subItems ? 'collapsed' : ''}`}
        data-bs-target={subItems ? `#${targetId}` : undefined}
        data-bs-toggle={subItems ? 'collapse' : undefined}
        href='#'
      >
        <i className={icon}></i>
        <span>{title}</span>
        {subItems && <i className='bi bi-chevron-down ms-auto'></i>}
      </a>
      {subItems && (
        <ul
          id={targetId}
          className='nav-content collapse'
          data-bs-parent='#sidebar-nav'
        >
          {subItems.map((subItem, index) => (
            <li key={index}>
              <a href={subItem.href}>
                <i className={subItem.icon}></i>
                <span>{subItem.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default SideBarItem;
