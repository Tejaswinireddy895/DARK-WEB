import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import CaseFiles from './CaseFiles';
import FIRGenerator from './FIRGenerator';

const App = () => {
  const [caseFiles, setCaseFiles] = useState([]);
  
  // Simulating fetching case files
  useEffect(() => {
    const fetchCaseFiles = async () => {
      // This is a placeholder for actual data fetching
      const files = await getCaseFiles();
      setCaseFiles(files);
    };

    fetchCaseFiles();
  }, []);

  const getCaseFiles = async () => {
    // Simulate an API call
    return [
      { id: 1, title: 'Case 1' },
      { id: 2, title: 'Case 2' }
    ];
  };

  return (
    <Router>
      <div>
        <h1>DARK WEB Application</h1>
        <Switch>
          <Route path="/case-files">
            <CaseFiles caseFiles={caseFiles} />
          </Route>
          <Route path="/fir-generator">
            <FIRGenerator />
          </Route>
          <Route path="/">
            <h2>Welcome to the Case Management System</h2>
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;