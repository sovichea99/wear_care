// Create a SimpleTest.jsx component
import { useEffect } from 'react';

export default function SimpleTest() {
  useEffect(() => {
    console.log('🧪 SimpleTest mounted');
    console.log('🔐 sessionStorage admin:', sessionStorage.getItem('admin'));
    
    // Test if we can stay on this page
    const timer = setTimeout(() => {
      console.log('✅ SimpleTest - Still on page after 5 seconds');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>If you can see this for more than 2 seconds, the issue is in Dashboard API calls.</p>
      <p>Check browser console for logs.</p>
    </div>
  );
}