import './Login.css';
import Logo from '../../assets/images/logoKruszarka.png';
const Login = () => {
  return (
    <div className='login-container d-flex align-items-center justify-content-center vh-100'>
      <div className='login-card p-5 shadow'>
        <div className='text-center mb-4'>
          <img src={Logo} alt='Logo' className='login-logo mb-3' />
          <h2>Welcome Back!</h2>
        </div>
        <form>
          <div className='form-group mb-3 position-relative'>
            <label htmlFor='username' className='form-label'>
              Username
            </label>
            <div className='input-group'>
              <span className='input-group-text'>
                <i className='bi bi-person-lines-fill'></i>
              </span>
              <input
                type='text'
                id='username'
                className='form-control'
                placeholder='Enter Username'
              />
            </div>
          </div>
          <div className='form-group mb-4 position-relative'>
            <label htmlFor='password' className='form-label'>
              Password
            </label>
            <div className='input-group'>
              <span className='input-group-text'>
                <i className='bi bi-shield-lock-fill'></i>
              </span>
              <input
                type='password'
                id='password'
                className='form-control'
                placeholder='Enter Password'
              />
            </div>
          </div>

          <button
            type='submit'
            className='btn w-100 btn-success custom-button-login d-flex justify-content-between align-items-center'
          >
            Login
            <i className='bi bi-arrow-right-short login-icon'></i>
          </button>
        </form>
        <div className='text-center mt-3'>
          <a href='#' className='forgot-password'>
            Forgot your password?{' '}
            <span className='text-primary'>Click Here</span>
          </a>
        </div>
      </div>
    </div>
  );
};
export default Login;
