import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

export function GitHubCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connecting to GitHub...');

  useEffect(() => {
    handleGitHubCallback();
  }, []);

  const handleGitHubCallback = async () => {
    // Get the session (Supabase auto-processes the OAuth callback)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      setStatus('Connection failed. Redirecting...');
      setTimeout(() => navigate('/dashboard/integrations'), 2000);
      return;
    }

    // Get the GitHub access token from session
    const providerToken = session.provider_token;
    const user = session.user;

    if (!providerToken) {
      setStatus('Could not get GitHub token. Try again.');
      setTimeout(() => navigate('/dashboard/integrations'), 2000);
      return;
    }

    setStatus('Fetching your GitHub profile...');

    try {
      // Fetch GitHub user info using the token
      const githubRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${providerToken}` }
      });
      const githubUser = await githubRes.json();

      setStatus('Saving connection...');

      // Save to Supabase github_connections table
      const { error: saveError } = await supabase
        .from('github_connections')
        .upsert({
          user_id: user.id,
          github_user_id: String(githubUser.id),
          github_username: githubUser.login,
          github_avatar_url: githubUser.avatar_url,
          github_email: githubUser.email,
          access_token: providerToken,
          token_type: 'bearer',
          token_scope: 'read:user,user:email,repo',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (saveError) {
        console.error('Save error:', saveError);
        setStatus('Saved connection...');
        // Continue anyway — might already exist
      }

      setStatus('Fetching your repositories...');

      // Fetch their repos
      const reposRes = await fetch(
        'https://api.github.com/user/repos?per_page=50&sort=updated',
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );
      const repos = await reposRes.json();

      // Get the connection ID
      const { data: connection } = await supabase
        .from('github_connections')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Save repos to Supabase
      if (repos && Array.isArray(repos) && connection) {
        const repoRows = repos.slice(0, 30).map(repo => ({
          user_id: user.id,
          github_connection_id: connection.id,
          repo_id: String(repo.id),
          repo_name: repo.name,
          repo_full_name: repo.full_name,
          repo_url: repo.html_url,
          repo_description: repo.description || '',
          is_private: repo.private,
          is_monitoring: false,
        }));

        await supabase
          .from('github_repos')
          .upsert(repoRows, { onConflict: 'user_id,repo_id' });
      }

      setStatus('✓ GitHub connected!');

      // Check intent from sessionStorage
      const intent = sessionStorage.getItem('github_connect_intent');
      sessionStorage.removeItem('github_connect_intent');
      
      const returnTo = intent 
        ? JSON.parse(intent).returnTo 
        : '/dashboard/integrations';

      setTimeout(() => navigate(returnTo + '?github=connected'), 1500);

    } catch (err) {
      console.error('GitHub callback error:', err);
      setStatus('Something went wrong. Redirecting...');
      setTimeout(() => navigate('/dashboard/integrations'), 2000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
    }}>
      {/* ARKVOID logo */}
      <div style={{ marginBottom: '8px' }}>
        <div className="flex items-center gap-2">
            <svg viewBox="0 0 100 100" className="w-8 h-8 fill-current text-white"><path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0ZM50 10L15.359 30V70L50 90L84.641 70V30L50 10Z"/><path d="M50 20L75.9808 35V65L50 80L24.0192 65V35L50 20ZM50 30L32.6795 40V60L50 70L67.3205 60V40L50 30Z"/><path d="M50 40L58.6603 45V55L50 60L41.3397 55V45L50 40Z"/></svg>
            <span className="font-bold text-xl tracking-tight text-white">ARKVOID</span>
        </div>
      </div>

      {/* GitHub logo */}
      <svg width="48" height="48" viewBox="0 0 24 24" fill="#F5F5F5">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>

      {/* Status */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Spinner (show while processing) */}
        {!status.includes('✓') && (
          <div style={{
            width: '24px', height: '24px',
            border: '2px solid #262626',
            borderTopColor: '#F59E0B',
            borderRadius: '50%',
            animation: 'spin 600ms linear infinite',
          }} />
        )}
        
        {/* Green check (show on success) */}
        {status.includes('✓') && (
          <div style={{
            width: '48px', height: '48px',
            background: '#22C55E22',
            border: '1px solid #22C55E',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>✓</div>
        )}

        <p style={{
          color: status.includes('✓') ? '#22C55E' : '#F5F5F5',
          fontSize: '16px',
          fontWeight: '600',
        }}>
          {status}
        </p>
        
        <p style={{ color: '#666', fontSize: '13px' }}>
          Connecting GitHub to ARKVOID
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
