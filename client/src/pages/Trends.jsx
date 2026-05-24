import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PatientTrendsView from '../components/PatientTrendsView';

export default function Trends() {
  const { user } = useContext(AuthContext);
  return <PatientTrendsView thresholds={user?.thresholds} />;
}
