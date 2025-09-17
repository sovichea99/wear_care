import { useEffect, useState } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  // Example static data - replace with API call
  useEffect(() => {
    api.get('admin/users', {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('authToken')}`
      }
    })
    .then(response => {
      console.log('Users:', response.data); // Log the response to check
      setCustomers(response.data);
    })
    .catch(error => {
      console.error('Error fetching users:', error);
    });
  }, []);
  

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <UsersIcon className="h-8 w-8 text-purple-500 mr-2" />
        <h2 className="text-2xl font-bold">Customers</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map(customer => (
              <tr key={customer.id}>
                <td className="px-6 py-4">#{customer.id}</td>
                <td className="px-6 py-4 font-medium">{customer.name}</td>
                <td className="px-6 py-4">{customer.email}</td>
                <td className="px-6 py-4">{customer.phone}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {customer.orders} orders
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No customers found
        </div>
      )}
    </div>
  );
}