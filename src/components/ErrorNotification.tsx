import React from 'react';
import { ErrorMessageType } from '../constants/ErrorMessageType';
import cn from 'classnames';

type Props = {
  errorMessage: ErrorMessageType | null;
  onClose: (error: ErrorMessageType | null) => void;
};

export const ErrorNotification: React.FC<Props> = ({
  errorMessage,
  onClose,
}) => {
  return (
    <div
      data-cy="ErrorNotification"
      className={cn(
        'notification',
        'is-danger',
        'is-light',
        'has-text-weight-normal',
        { hidden: !errorMessage },
      )}
    >
      <button
        data-cy="HideErrorButton"
        type="button"
        className="delete"
        onClick={() => onClose(null)}
      />
      {errorMessage}
    </div>
  );
};
