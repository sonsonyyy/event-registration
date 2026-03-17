import type { FormEventHandler, SyntheticEvent } from 'react';

function resolveFieldErrorKey(target: EventTarget | null): string | null {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    const explicitField = target.dataset.errorField;

    if (explicitField) {
        return explicitField;
    }

    if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
    ) {
        return target.name || target.id || null;
    }

    return target.getAttribute('name') || target.getAttribute('id') || null;
}

export function createClearFormErrorHandlers(
    clearErrors: unknown,
): {
    onInput: FormEventHandler<HTMLElement>;
    onChange: FormEventHandler<HTMLElement>;
} {
    const clearErrorsCallback = clearErrors as (...fields: string[]) => void;

    const clearFieldError = (event: SyntheticEvent<HTMLElement>): void => {
        const field = resolveFieldErrorKey(event.target);

        if (field) {
            clearErrorsCallback(field);
        }
    };

    return {
        onInput: clearFieldError,
        onChange: clearFieldError,
    };
}
