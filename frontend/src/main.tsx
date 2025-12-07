import "./amplify-init";
import ReactDOM from 'react-dom/client'
import AppWrapper from './App'
import '@aws-amplify/ui-react/styles.css'
import './index.css'

console.log("== main loaded ==");

ReactDOM.createRoot(document.getElementById("root")!).render(<AppWrapper />);