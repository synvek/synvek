import { useEffect, useState } from 'react';

export default () => {
  const [initialized, setInitialized] = useState<boolean>(false);


  const initialize = async () => {
    setInitialized(true);
  };
  
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  });


  return <div style={{ width: '100%', height: '100%' }}></div>;
};
