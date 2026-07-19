/**
 * Playbooks View Component
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen, Plus, Upload, Calendar, CheckCircle } from 'lucide-react';
import type { Playbook } from '@/lib/types';
import { formatRelativeDate } from '@/lib/utils';

interface PlaybooksViewProps {
  playbooks: Playbook[];
}

export function PlaybooksView({ playbooks }: PlaybooksViewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (playbooks.length === 0 && !showCreateDialog) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-text-primary mb-3">
              Playbooks
            </h1>
            <p className="text-text-secondary">
              Custom baselines created from your standard terms and policies.
            </p>
          </div>
        </div>

        <EmptyState
          icon={BookOpen}
          title="No playbooks created"
          description="Upload your standard terms or policy documents to create baselines. Compare future documents against these playbooks for policy compliance."
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playbook
            </Button>
          }
        />

        {showCreateDialog && <CreatePlaybookDialog onClose={() => setShowCreateDialog(false)} />}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-text-primary mb-3">
            Playbooks
          </h1>
          <p className="text-text-secondary">
            {playbooks.length} {playbooks.length === 1 ? 'playbook' : 'playbooks'} created
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Playbook
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {playbooks.map((playbook) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
      </div>

      {showCreateDialog && <CreatePlaybookDialog onClose={() => setShowCreateDialog(false)} />}
    </div>
  );
}

function PlaybookCard({ playbook }: { playbook: Playbook }) {
  const termsCount = Object.keys(playbook.baseline.extractedTerms).length;
  const sectionsCount = playbook.baseline.sections.length;

  return (
    <Card className="hover:bg-hover transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2">{playbook.name}</CardTitle>
            <p className="text-sm text-text-secondary">{playbook.description}</p>
          </div>
          <Badge variant="secondary">
            <BookOpen className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Extracted Terms</span>
            <span className="font-medium text-text-primary">{termsCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Sections</span>
            <span className="font-medium text-text-primary">{sectionsCount}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border">
            <Calendar className="h-3 w-3" />
            Created {formatRelativeDate(playbook.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePlaybookDialog({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);

      const response = await fetch('/api/playbooks/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create playbook');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error creating playbook:', error);
      alert('Failed to create playbook. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Playbook</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Playbook Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Vendor Agreement"
                className="w-full px-3 py-2 bg-base border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this playbook is used for..."
                rows={3}
                className="w-full px-3 py-2 bg-base border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Policy Document
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.docx,.txt,.md"
                className="w-full px-3 py-2 bg-base border border-border rounded-md text-sm text-text-primary file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-accent file:text-text-inverse file:cursor-pointer hover:file:bg-accent-hover"
                required
              />
              <p className="text-xs text-text-muted mt-1">
                Upload your standard terms, policy, or template document
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={uploading || !file || !name}>
                {uploading ? 'Creating...' : 'Create Playbook'}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
