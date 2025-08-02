import React from 'react';
import { EmbeddingQueueMonitor } from '@/components/admin/EmbeddingQueueMonitor';

const EmbeddingQueuePage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Embedding Queue</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage automatic article embedding processing for smart chat functionality.
        </p>
      </div>
      
      <EmbeddingQueueMonitor />
    </div>
  );
};

export default EmbeddingQueuePage;