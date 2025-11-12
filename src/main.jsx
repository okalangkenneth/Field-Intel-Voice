import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { fontFamily, colors } from './styles/index.js';

// Global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${fontFamily.primary};
    font-size: 16px;
    line-height: 1.6;
    color: ${colors.neutral[900]};
    background-color: ${colors.neutral[50]};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100vh;
  }

  button {
    font-family: ${fontFamily.primary};
  }

  input, textarea {
    font-family: ${fontFamily.primary};
  }
`;
document.head.appendChild(styleSheet);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
