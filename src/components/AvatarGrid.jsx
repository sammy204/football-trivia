import { useEffect, useState } from 'react';
import { GAME_AVATARS } from '../lib/avatars';
import styles from './AvatarGrid.module.css';

export default function AvatarGrid({ value, onChange }) {
  const [selected, setSelected] = useState(value || '');

  useEffect(() => {
    setSelected(value || '');
  }, [value]);

  const handleSelect = (avatar) => {
    setSelected(avatar.src);
    onChange(avatar.src);
  };

  return (
    <div className={styles.avatarGrid}>
      <h3 className={styles.avatarTitle}>Choose Avatar</h3>
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
    </div>
  );
}
