import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Trash2, AlertTriangle, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function DemoUserManagement() {
  const [count, setCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('bulkCreateDemoUsers', { count: parseInt(count, 10) });
      const data = response.data || response;
      setResult(data);
      toast.success(`Created ${data.created} demo users (demo_f${data.starting_sequence} - demo_f${data.ending_sequence})`);
    } catch (error) {
      toast.error('Failed to generate demo users: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialog(false);
    setIsDeleting(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('deleteDemoUsers', {});
      const data = response.data || response;
      setResult(data);
      toast.success(`Deleted ${data.profilesDeleted} demo users with full cleanup`);
    } catch (error) {
      toast.error('Failed to delete demo users: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Demo User Management
          </CardTitle>
          <CardDescription>
            Generate bulk demo users (demo_f prefix) for performance testing, or delete them with full cleanup of all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate section */}
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center gap-2 font-medium">
              <Users className="w-4 h-4" />
              Generate Demo Users
            </div>
            <p className="text-sm text-muted-foreground">
              Creates demo MemberProfile records with realistic data (verified female profiles). The function automatically continues from the highest existing demo_f sequence number.
            </p>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="count">Number of users</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="5000"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-40"
                  disabled={isGenerating}
                />
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating || isDeleting}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" /> Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Delete section */}
          <div className="space-y-3 border border-destructive/30 rounded-lg p-4 bg-destructive/5">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete All Demo Users
            </div>
            <p className="text-sm text-muted-foreground">
              Deletes all profiles with a <code className="text-xs bg-muted px-1 py-0.5 rounded">demo_</code> user_id prefix and cleans up all associated data: conversations, messages, winks, favorites, private photos, photo reviews, reports, tickets, token transactions, and Cloudinary images. No orphaned data is left behind.
            </p>
            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This action is irreversible. It will delete ALL demo users and their associated data.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialog(true)} disabled={isGenerating || isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Delete All Demo Users
                </>
              )}
            </Button>
          </div>

          {/* Result display */}
          {result && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="font-medium mb-2">Last operation result:</div>
              <pre className="text-xs overflow-auto bg-background p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Delete All Demo Users
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all MemberProfile records with a <code>demo_</code> user_id prefix and clean up all associated data (conversations, messages, winks, favorites, private photos, reports, tickets, etc.). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              Yes, Delete All Demo Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}