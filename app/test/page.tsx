'use client';

import { useState } from 'react';
import { useBracketStore } from '@/app/store/bracketStore';

export default function TestPage() {
  const [status, setStatus] = useState('Klaar om te testen');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const store = useBracketStore();

  const testSupabase = async () => {
    setStatus('Testen...');
    setError(null);
    setResult(null);

    try {
      // Test 1: Create tournament
      setStatus('Tournament aanmaken...');
      const tournamentId = await store.createTournamentInSupabase();
      
      if (!tournamentId) {
        throw new Error('Kon tournament niet aanmaken');
      }

      setResult({ step: 1, success: true, tournamentId });
      setStatus('Tournament aangemaakt!');

      // Test 2: Set tournament ID
      store.setTournamentId(tournamentId);
      setResult(prev => ({ ...prev, step: 2, success: true }));

      // Test 3: Verify tournament exists in database
      setStatus('Verifiëren tournament in database...');
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: tournament, error: verifyError } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('id', tournamentId)
        .single();

      if (verifyError || !tournament) {
        console.error('Tournament verification failed:', verifyError);
        throw new Error(`Tournament ${tournamentId} bestaat niet in database. Error: ${verifyError?.message || 'Not found'}`);
      }

      console.log('✅ Tournament verified in database:', tournament);
      setResult(prev => ({ ...prev, step: 3, success: true, tournamentName: tournament.name }));
      
      // Small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test 4: Add team
      setStatus('Team toevoegen...');
      const currentTournamentId = store.tournamentId;
      console.log('Adding team with tournament ID:', currentTournamentId);
      
      await store.addTeam({
        id: 'test-' + Date.now(),
        name: 'Test Team',
        countryCode: 'NL',
      });

      setResult(prev => ({ 
        ...prev, 
        step: 4, 
        success: true, 
        teamsCount: store.teams.length,
        tournamentId: currentTournamentId
      }));
      setStatus('✅ Alles werkt!');

    } catch (err: any) {
      setError(err.message || 'Onbekende error');
      setStatus('❌ Error opgetreden');
      console.error('Test error:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Supabase Test</h1>
      
      <button
        onClick={testSupabase}
        disabled={status === 'Testen...'}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: status === 'Testen...' ? 'not-allowed' : 'pointer',
          marginBottom: '2rem'
        }}
      >
        {status === 'Testen...' ? 'Testen...' : 'Test Supabase'}
      </button>

      <div style={{ marginTop: '2rem' }}>
        <p><strong>Status:</strong> {status}</p>
        
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px'
          }}>
            <p><strong>Error:</strong> {error}</p>
            <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
              Open browser console (F12) voor meer details
            </p>
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px'
          }}>
            <p><strong>Resultaat:</strong></p>
            <pre style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
            {result.tournamentId && (
              <p style={{ marginTop: '1rem' }}>
                <strong>Tournament ID:</strong> {result.tournamentId}
              </p>
            )}
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <h3>Wat te controleren:</h3>
          <ol>
            <li>Klik op "Test Supabase"</li>
            <li>Als het werkt: Check Supabase Dashboard → Table Editor</li>
            <li>Als het niet werkt: Open browser console (F12) en kopieer de error</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

