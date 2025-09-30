// Simple Cases Table Component

import { Button } from '../ui';
import { Trash2 } from "@deemlol/next-icons";

// Define what a Case looks like
interface Case {
  id: string;
  title: string;
  type: string;
  status: 'new' | 'processing' | 'completed';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

interface CasesTableProps {
  cases: Case[];
  onViewCase: (caseId: string) => void;
  loading?: boolean;
}

export function CasesTable(props: CasesTableProps) {
  const { cases, onViewCase, loading = false } = props;

  // Function to get status badge color
  function getStatusColor(status: string): string {
    if (status === 'new') {
      return 'bg-blue-100 text-blue-800';
    }
    if (status === 'processing') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (status === 'completed') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  // Function to format case type
  function formatCaseType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  // Function to format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-12 text-center">
          <div className="text-gray-500">Loading cases...</div>
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No cases</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first case.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Table Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Cases</h2>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search cases..."
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button>+ New Case</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Case Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Case Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases.map((caseItem) => (
              <tr key={caseItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {caseItem.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(caseItem.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCaseType(caseItem.type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                </td>
                <td className="flex justify-start gap-x-3 px-6 py-4 whitespace-nowrap">
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => onViewCase(caseItem.id)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small"
                    onClick={() => onViewCase(caseItem.id)}
                  >
                      <Trash2 size={16} color="#FFFFFF" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}