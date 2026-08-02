import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { entitiesToMigrate } from '@/lib/migrationConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe, ArrowRight, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';

export default function DataMigrationAdmin() {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [fullMigrationDone, setFullMigrationDone] = useState(false);
  const [lastMigrationDate, setLastMigrationDate] = useState(null);
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message, type) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type: type || 'info' }]);
  };

  const isValidUrl = (url) => {
    return url.startsWith('https://') && url.length > 8;
  };

  const runMigration = async (isIncremental) => {
    if (!isValidUrl(destinationUrl)) return;
    setIsMigrating(true);
    const since = isIncremental ? lastMigrationDate : null;

    addLog('Starting ' + (isIncremental ? 'incremental' : 'full') + ' migration to ' + destinationUrl + '...', 'info');

    let successCount = 0;
    let failCount = 0;

    for (const entityName of entitiesToMigrate) {
      addLog('Migrating ' + entityName + '...', 'info');
      try {
        const response = await base44.functions.invoke('sendMigrationData', {
          entityName: entityName,
          since: since,
          productionUrl: destinationUrl,
        });
        const result = response.data;
        if (result.success) {
          addLog('  \u2713 ' + entityName + ': ' + result.message, 'success');
          successCount++;
        } else {
          addLog('  \u2717 ' + entityName + ': ' + result.error, 'error');
          failCount++;
        }
      } catch (error) {
        addLog('  \u2717 ' + entityName + ': ' + (error.response?.data?.error || error.message), 'error');
        failCount++;
      }
    }

    const now = new Date().toISOString();
    setLastMigrationDate(now);
    if (!isIncremental) setFullMigrationDone(true);

    addLog('Migration complete: ' + successCount + ' succeeded, ' + failCount + ' failed.', successCount > 0 && failCount === 0 ? 'success' : 'info');
    setIsMigrating(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Data Migration to Production</h1>
        <p className="text-muted-foreground mt-1">Use this tool to push data from this dev app to a target production app.</p>
      </div>

      {/* Step 1 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Set Destination URL</CardTitle>
          <CardDescription>
            Enter the full base URL of the app you want to migrate data to (e.g. https://your-prod-app.base44.app).
            The destination app must have the <code className="text-xs bg-muted px-1 py-0.5 rounded">receiveMigrationData</code> function installed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="url"
              placeholder="https://..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              disabled={isMigrating}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 2: Initial Full Migration</CardTitle>
          <CardDescription>
            This will migrate ALL records for the selected entities. Run this once to populate the destination app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => runMigration(false)}
            disabled={isMigrating || !isValidUrl(destinationUrl)}
          >
            <ArrowRight className="w-4 h-4" />
            Run Initial Full Migration
          </Button>
        </CardContent>
      </Card>

      {/* Step 3 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 3: Incremental "Delta" Migration</CardTitle>
          <CardDescription>
            This migrates only records updated since the last migration. Run this after the DNS switch to catch any lingering updates on this app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => runMigration(true)}
            disabled={isMigrating || !fullMigrationDone || !isValidUrl(destinationUrl)}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4" />
            Run Incremental Migration
          </Button>
          {lastMigrationDate && (
            <p className="text-xs text-muted-foreground mt-2">
              Last migration: {new Date(lastMigrationDate).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Migration Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Migration Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-950 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-zinc-500">No migration logs yet. Start a migration to see output here.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={
                  'mb-1 ' +
                  (log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  'text-zinc-300')
                }>
                  <span className="text-zinc-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Setup warning */}
      <Card className="mt-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Setup Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set the same <code className="text-xs bg-muted px-1 py-0.5 rounded">MIGRATION_API_KEY</code> secret in both this app and the destination app's environment variables.
                The destination app must already have the <code className="text-xs bg-muted px-1 py-0.5 rounded">receiveMigrationData</code> function deployed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}