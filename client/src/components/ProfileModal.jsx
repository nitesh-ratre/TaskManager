import { useEffect, useState } from 'react';
import { TEAM_MEMBERS } from '../data/seedData.js';

export function ProfileModal({
  isOpen,
  initialTab = 'profile',
  onClose,
  workspace,
  onUpdateProfile,
  onSwitchUser,
  onOpenTrash,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile'); // 'profile' | 'settings' | 'switch'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const currentProfile = workspace.userProfile || {
    id: 'alex',
    name: workspace.userName || 'Alex Morgan',
    email: 'alex@acme.studio',
    title: 'Product Lead & Designer',
    bio: 'Focusing on calm software, typography, and humane product pacing.',
    initials: 'AM',
    color: '#1d4e3b',
    timezone: 'America/New_York (GMT-5)',
    statusMessage: 'In deep work on Website Redesign',
    statusEmoji: '🌿',
  };

  const [form, setForm] = useState({
    name: currentProfile.name || workspace.userName || 'Alex Morgan',
    email: currentProfile.email || 'alex@acme.studio',
    title: currentProfile.title || 'Product Lead & Designer',
    bio: currentProfile.bio || '',
    timezone: currentProfile.timezone || 'America/New_York (GMT-5)',
    statusMessage: currentProfile.statusMessage || '',
    statusEmoji: currentProfile.statusEmoji || '🌿',
  });

  const [savedToast, setSavedToast] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    onUpdateProfile?.({
      ...currentProfile,
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      bio: form.bio.trim(),
      timezone: form.timezone,
      statusMessage: form.statusMessage.trim(),
      statusEmoji: form.statusEmoji,
      initials:
        form.name
          .trim()
          .split(' ')
          .map((p) => p[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'AM',
    });
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 450);
  }

  function handleSelectMember(member) {
    onSwitchUser?.(member);
    onClose();
  }

  const trashCount = workspace.trashItems?.length || 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-panel"
        style={{ maxWidth: 560, padding: '24px 28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--primary)' }}>
              {activeTab === 'settings' ? 'tune' : activeTab === 'switch' ? 'switch_account' : 'account_circle'}
            </span>
            <h2 className="serif" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 500 }}>
              {activeTab === 'settings' ? 'Settings & Storage' : activeTab === 'switch' ? 'Switch Teammate' : 'Your Profile'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-circle-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div className="segmented-toggle" style={{ marginBottom: 20, width: '100%', display: 'flex' }}>
          <button
            type="button"
            className={`segmented-btn ${activeTab === 'profile' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeTab === 'settings' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab('settings')}
          >
            Settings &amp; Trash
          </button>
          <button
            type="button"
            className={`segmented-btn ${activeTab === 'switch' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab('switch')}
          >
            Switch ({TEAM_MEMBERS.length})
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 16px',
                background: 'var(--surface-low)',
                borderRadius: 14,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: currentProfile.color || 'var(--primary)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {currentProfile.initials || 'AM'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.96rem' }}>
                  {form.statusEmoji} {form.name || 'Alex'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--outline)' }}>
                  {form.title || 'Product Lead'} • {workspace.workspaceName}
                </div>
              </div>
              <span className="status-badge green">Online</span>
            </div>

            <div className="modal-field">
              <label htmlFor="profile-status">Current focus &amp; status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="profile-emoji"
                  type="text"
                  style={{ width: 48, textAlign: 'center' }}
                  value={form.statusEmoji}
                  onChange={(e) => setForm({ ...form, statusEmoji: e.target.value })}
                  title="Emoji status"
                />
                <input
                  id="profile-status"
                  type="text"
                  placeholder="e.g., In deep work on Website Redesign"
                  value={form.statusMessage}
                  onChange={(e) => setForm({ ...form, statusMessage: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="modal-field">
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label htmlFor="profile-title">Role / Title</label>
                <input
                  id="profile-title"
                  type="text"
                  placeholder="e.g. Lead Designer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="modal-field">
                <label htmlFor="profile-email">Email address</label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="modal-field">
                <label htmlFor="profile-tz">Timezone</label>
                <select
                  id="profile-tz"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                >
                  <option value="America/New_York (GMT-5)">America/New_York (GMT-5)</option>
                  <option value="America/Chicago (GMT-6)">America/Chicago (GMT-6)</option>
                  <option value="America/Los_Angeles (GMT-8)">America/Los_Angeles (GMT-8)</option>
                  <option value="Europe/London (GMT+0)">Europe/London (GMT+0)</option>
                  <option value="Europe/Berlin (GMT+1)">Europe/Berlin (GMT+1)</option>
                  <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                </select>
              </div>
            </div>

            <div className="modal-field">
              <label htmlFor="profile-bio">Bio / Working Style</label>
              <textarea
                id="profile-bio"
                rows={2}
                placeholder="Share your typical hours, focus blocks, or preferences..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {savedToast ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Settings & Trash Management */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Trash Section */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                border: '1px solid rgba(190, 201, 192, 0.45)',
                background: 'var(--surface-low)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--error)' }}>
                      delete
                    </span>
                    <strong style={{ fontSize: '0.98rem' }}>Trash &amp; Deleted Items</strong>
                    <span className="pill-tag" style={{ background: 'var(--surface)', fontWeight: 700 }}>
                      {trashCount} items
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                    Projects, lists, and tasks deleted from your workspace stay in the 30-day buffer before being permanently purged.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => {
                    onClose();
                    onOpenTrash?.();
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    visibility
                  </span>
                  Open Trash
                </button>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(154, 245, 198, 0.35)',
                  fontSize: '0.76rem',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  timer
                </span>
                <span>You can restore items back to their active places anytime, or permanently erase them immediately.</span>
              </div>
            </div>

            {/* Notification rhythm preference */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                border: '1px solid rgba(190, 201, 192, 0.45)',
                background: 'var(--surface-low)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>
                  notifications_paused
                </span>
                <strong style={{ fontSize: '0.98rem' }}>Calm Notification Delivery</strong>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>
                Batches digest summaries twice daily (9:00 AM &amp; 4:30 PM) so teammates stay in uninterrupted flow.
              </p>
              <span className="status-badge green">Active &amp; Batched</span>
            </div>
          </div>
        )}

        {/* Tab 3: Switch Teammate */}
        {activeTab === 'switch' && (
          <div>
            <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--outline)' }}>
              Quickly switch your active session identity across teammates to test assignments and views:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {TEAM_MEMBERS.map((member) => {
                const isSelected =
                  currentProfile.id === member.id ||
                  workspace.userName?.toLowerCase() === member.name.toLowerCase();

                return (
                  <button
                    key={member.id}
                    type="button"
                    className="hq-tool-tile"
                    style={{
                      border: isSelected
                        ? '1px solid var(--primary)'
                        : '1px solid rgba(190, 201, 192, 0.4)',
                      background: isSelected ? 'rgba(154, 245, 198, 0.25)' : 'var(--surface-low)',
                    }}
                    onClick={() => handleSelectMember(member)}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: member.color,
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      {member.initials}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{member.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--outline)' }}>
                        {member.name.toLowerCase()}@{workspace.workspaceName.toLowerCase().replace(/\s+/g, '')}.cc
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="status-badge green">Active</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--outline)' }}>
                        arrow_forward
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
