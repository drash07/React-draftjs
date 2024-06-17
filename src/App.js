import './App.css';
import MyEditor from './Editor';

function App() {
  const handleSave = () => {
    console.log('Saving in local Storage...');
  }
  return (
    <div>
      <h1>Demo Editor by Drashti</h1>
        <MyEditor onSave={handleSave}/> 
    </div>
   
   
  );
}

export default App;
