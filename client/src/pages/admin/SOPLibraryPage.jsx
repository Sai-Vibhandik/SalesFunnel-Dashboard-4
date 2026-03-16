import { Card, CardBody, Button } from '@/components/ui';
import { BookOpen, FileText, Upload, Folder } from 'lucide-react';

export default function SOPLibraryPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOP Library</h1>
          <p className="text-gray-600 mt-1">Standard Operating Procedures for team workflows</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload SOP
        </Button>
      </div>

      {/* SOP Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Design SOPs</h3>
            </div>
            <p className="text-sm text-gray-500">
              Graphic design and creative workflows
            </p>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Development SOPs</h3>
            </div>
            <p className="text-sm text-gray-500">
              Landing page development procedures
            </p>
          </CardBody>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Testing SOPs</h3>
            </div>
            <p className="text-sm text-gray-500">
              Quality assurance procedures
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Placeholder */}
      <Card>
        <CardBody className="py-12">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">SOP Library</h3>
            <p className="text-gray-500 mb-4">
              This module will contain Standard Operating Procedures for all team roles.
              Admins can upload and manage SOP documents for each workflow.
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