import { useEffect, useRef, useState } from 'react';

export interface ConfirmDialogRequest {
  title: string;
  copy: string;
  confirmText: string;
  requireInputLabel?: string;
  inputPlaceholder?: string;
  danger?: boolean;
}

// `true` for plain confirmations, the entered string when an input is
// required, `null` when cancelled.
export type ConfirmDialogResult = string | true | null;

export function ConfirmDialog({
  request,
  onResolve,
}: {
  request: ConfirmDialogRequest | null;
  onResolve: (value: ConfirmDialogResult) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [inputValue, setInputValue] = useState('');

  const requiresInput = Boolean(request?.requireInputLabel);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (request) {
      setInputValue('');
      if (!dialog.open) {
        dialog.showModal();
      }
      window.setTimeout(() => {
        (requiresInput ? inputRef.current : confirmRef.current)?.focus();
      }, 0);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [request, requiresInput]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onResolve(null);
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
    // onResolve is stable for the feature's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConfirm() {
    if (requiresInput) {
      const value = inputValue.trim();
      if (!value) {
        inputRef.current?.focus();
        return;
      }
      onResolve(value);
      return;
    }

    onResolve(true);
  }

  return (
    <dialog id="confirm-dialog" className="confirm-dialog" ref={dialogRef}>
      <form method="dialog" className="confirm-dialog-panel" onSubmit={event => event.preventDefault()}>
        <div className="confirm-dialog-kicker">Confirm action</div>
        <div id="confirm-dialog-title" className="card-title">
          {request?.title ?? ''}
        </div>
        <p id="confirm-dialog-copy" className="confirm-dialog-copy">
          {request?.copy ?? ''}
        </p>
        {requiresInput ? (
          <label id="confirm-dialog-input-wrap" className="confirm-dialog-field">
            <span id="confirm-dialog-input-label" className="program-field-label">
              {request?.requireInputLabel}
            </span>
            <input
              id="confirm-dialog-input"
              type="text"
              autoComplete="off"
              placeholder={request?.inputPlaceholder ?? ''}
              ref={inputRef}
              value={inputValue}
              onChange={event => setInputValue(event.target.value)}
            />
          </label>
        ) : null}
        <div className="confirm-dialog-actions">
          <button id="confirm-dialog-cancel" className="secondary-button" type="button" onClick={() => onResolve(null)}>
            Cancel
          </button>
          <button
            id="confirm-dialog-confirm"
            type="button"
            className={request?.danger ? 'program-inline-danger' : undefined}
            ref={confirmRef}
            onClick={handleConfirm}
          >
            {request?.confirmText ?? 'Confirm'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
