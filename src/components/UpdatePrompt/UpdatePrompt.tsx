import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLanguage } from '../../i18n';
import './UpdatePrompt.css';

// Never reloads on its own: form data lives only in memory (CLAUDE.md rule 1), so the user decides when.
export default function UpdatePrompt() {
  const { t } = useLanguage();
  const labels = t.pwa;
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (needRefresh) {
    return (
      <div className="update-prompt" role="alertdialog" aria-labelledby="updatePromptTitle" aria-describedby="updatePromptHint">
        <p id="updatePromptTitle" className="update-prompt-title">{labels.updateAvailable}</p>
        <p id="updatePromptHint" className="update-prompt-hint">{labels.updateHint}</p>
        <div className="update-prompt-actions">
          <button type="button" className="btn btn-small btn-primary" onClick={() => updateServiceWorker(true)}>
            {labels.reload}
          </button>
          <button type="button" className="btn btn-small btn-secondary" onClick={() => setNeedRefresh(false)}>
            {labels.later}
          </button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="update-prompt" role="status">
        <p className="update-prompt-title">{labels.offlineReady}</p>
        <div className="update-prompt-actions">
          <button type="button" className="btn btn-small btn-secondary" onClick={() => setOfflineReady(false)}>
            {labels.dismiss}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
