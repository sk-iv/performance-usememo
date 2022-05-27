import PerformanceCollector from "./PerformanceCollector/PerformanceCollector";
import './App.css';

function App() {
  const data = Array.from(Array(1500).keys());

  return <PerformanceCollector data={data} />;
}

export default App;
