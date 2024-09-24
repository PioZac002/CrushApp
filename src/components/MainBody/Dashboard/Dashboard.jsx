import React from 'react';
import Card from './Card';
import './dashboard.css';

const Dashboard = () => {
  return (
    <section className='dashboard section'>
      <div className='row'>
        <div className='col-lg-4 col-md-6 mb-4'>
          <Card title='Lista Integratorów' icon='bi bi-people'>
            {/* Możesz wstawić listę integratorów tutaj */}
            <ul>
              <li>Integrator 1</li>
              <li>Integrator 2</li>
              <li>Integrator 3</li>
            </ul>
          </Card>
        </div>

        <div className='col-lg-4 col-md-6 mb-4'>
          <Card title='Lista Pracowników' icon='bi bi-person-lines-fill'>
            {/* Możesz wstawić listę pracowników tutaj */}
            <ul>
              <li>Pracownik 1</li>
              <li>Pracownik 2</li>
              <li>Pracownik 3</li>
            </ul>
          </Card>
        </div>

        <div className='col-lg-4 col-md-6 mb-4'>
          <Card title='Lista Grup' icon='bi bi-grid'>
            {/* Możesz wstawić listę grup tutaj */}
            <ul>
              <li>Grupa 1</li>
              <li>Grupa 2</li>
              <li>Grupa 3</li>
            </ul>
          </Card>
        </div>

        <div className='col-lg-12'>
          <Card title='Wykres' icon='bi bi-bar-chart'>
            <h1>AAAAAAAAAA</h1>
            {/* Zakładam, że tu dodasz komponent Chart.js */}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
