import { Card, CardBody, Button } from '@/components/ui';
import { Users, UserPlus, Building } from 'lucide-react';

export default function ClientsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage client accounts and information</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Placeholder */}
      <Card>
        <CardBody className="py-12">
          <div className="text-center">
            <Building className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Client Management</h3>
            <p className="text-gray-500 mb-4">
              This module will allow admins to manage client accounts, view client projects, and track client relationships.
            </p>
            <p className="text-sm text-gray-400">
              Feature coming soon...
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}