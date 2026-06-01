import { useEffect, useState } from 'react';
import { AVATAR_FRAMES, GAME_AVATARS } from '../lib/avatars';
import AvatarFrame from './AvatarFrame';
import styles from './AvatarGrid.module.css';

export default function AvatarGrid({
  value,
  onChange,
  ownedFrames = [],
  equippedFrame = null,
  coinBalance = 0,
  onBuyFrame,
  onEquipFrame,
  onUnequipFrame,
}) {
  const [selected, setSelected] = useState(value || '');
  const [tab, setTab] = useState('avatar');

  useEffect(() => {
    setSelected(value || '');
  }, [value]);

  const handleSelect = (avatar) => {
    setSelected(avatar.src);
    onChange(avatar.src);
  };

  const previewAvatar = value || GAME_AVATARS[0].src;
  const tabStyle = (tabName) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    background: tab === tabName ? 'var(--green)' : 'rgba(255,255,255,0.05)',
    color: tab === tabName ? 'var(--pitch)' : 'var(--muted)',
    border: 'none',
    cursor: 'pointer',
  });

  const actionButtonStyle = ({ active = false, disabled = false, buy = false } = {}) => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 12,
    background: active ? 'var(--green)' : buy ? '#FFD700' : 'rgba(255,255,255,0.08)',
    color: active ? 'var(--pitch)' : buy ? '#000' : disabled ? 'var(--muted)' : 'var(--white)',
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    flexShrink: 0,
  });

  return (
    <div className={styles.avatarGrid}>
      <h3 className={styles.avatarTitle}>Choose Avatar</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" style={tabStyle('avatar')} onClick={() => setTab('avatar')}>Avatar</button>
        <button type="button" style={tabStyle('frames')} onClick={() => setTab('frames')}>Frames</button>
      </div>

      {tab === 'avatar' && (
        <div className={styles.avatarOptions}>
          {GAME_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              className={`${styles.avatarBtn} ${selected === avatar.src ? styles.selected : ''}`}
              onClick={() => handleSelect(avatar)}
              title={`Select ${avatar.name}`}
            >
              <img className={styles.avatar} src={avatar.src} alt={avatar.name} />
            </button>
          ))}
        </div>
      )}

      {tab === 'frames' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 8,
            border: `1px solid ${!equippedFrame ? 'var(--green)' : 'var(--card-border)'}`,
            background: !equippedFrame ? 'rgba(0,255,135,0.06)' : 'var(--card-bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <AvatarFrame frameId={null} size={44}>
                <img src={previewAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </AvatarFrame>
              <span style={{ fontWeight: 700, fontSize: 14 }}>No Frame</span>
            </div>
            <button
              type="button"
              onClick={onUnequipFrame}
              disabled={!equippedFrame}
              style={actionButtonStyle({ active: !equippedFrame, disabled: !equippedFrame })}
            >
              {!equippedFrame ? 'Active' : 'Remove'}
            </button>
          </div>

          {AVATAR_FRAMES.map((frame) => {
            const owned = ownedFrames.includes(frame.id);
            const equipped = equippedFrame === frame.id;
            const canAfford = coinBalance >= frame.price;

            return (
              <div key={frame.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 8,
                border: `1px solid ${equipped ? 'var(--green)' : 'var(--card-border)'}`,
                background: equipped ? 'rgba(0,255,135,0.06)' : 'var(--card-bg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <AvatarFrame frameId={frame.id} size={44}>
                    <img src={previewAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </AvatarFrame>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{frame.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{frame.description}</div>
                    {!owned && (
                      <div style={{ fontSize: 12, color: canAfford ? '#FFD700' : '#FF5C5C', fontWeight: 700, marginTop: 2 }}>
                        {frame.price}C {!canAfford ? '- Not enough coins' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {equipped ? (
                  <button
                    type="button"
                    onClick={() => onEquipFrame?.(null)}
                    style={actionButtonStyle({ active: true })}
                  >
                    Equipped
                  </button>
                ) : owned ? (
                  <button
                    type="button"
                    onClick={() => onEquipFrame?.(frame.id)}
                    style={actionButtonStyle()}
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onBuyFrame?.(frame)}
                    disabled={!canAfford}
                    style={actionButtonStyle({ buy: canAfford, disabled: !canAfford })}
                  >
                    Buy
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
