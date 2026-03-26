import { AlertTriangle, ExternalLink } from 'lucide-react';

interface Props { error: string; }

export default function FirestoreErrorBanner({ error }: Props) {
  const isPermission = error.includes('Missing or insufficient permissions') ||
    error.toLowerCase().includes('permission');
  const isUnavailable = error.includes('unavailable') || error.includes('offline');

  return (
    <div className="firestore-banner">
      <AlertTriangle size={18} color="var(--yellow)" style={{ flexShrink: 0 }} />
      <div className="firestore-banner-body">
        <strong>
          {isPermission
            ? 'Firestore: нет доступа — нужно обновить правила'
            : isUnavailable
            ? 'Firestore недоступен — проверь интернет-соединение'
            : 'Ошибка подключения к базе данных'}
        </strong>
        {isPermission && (
          <p>
            Открой{' '}
            <a
              href="https://console.firebase.google.com/project/ozonpvz-491308/firestore/rules"
              target="_blank"
              rel="noreferrer"
              className="banner-link"
            >
              Firebase Console → Firestore → Правила <ExternalLink size={12} />
            </a>
            {' '}и замени содержимое на:{' '}
            <code className="banner-code">allow read, write: if true;</code>
            {' '}затем нажми <strong>Опубликовать</strong>.
          </p>
        )}
        <p className="banner-detail">{error}</p>
      </div>
    </div>
  );
}
