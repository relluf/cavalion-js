define([], (Clipboard) => {
	
    const listeners = {
        copy: [],
        paste: []
    };
    const createEvent = (eventName) => ({
        addListener: (callback) => {
            if (typeof callback !== 'function') {
                throw new Error('Listener must be a function');
            }
            listeners[eventName].push(callback);
        },
        removeListener: (callback) => {
            const index = listeners[eventName].indexOf(callback);
            if (index !== -1) {
                listeners[eventName].splice(index, 1);
            }
        }
    });

    const notifyListeners = (event, data) => {
        listeners[event].forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Error in listener:', error);
            }
        });
    };

    const onCopy = createEvent('copy');
    const onPaste = createEvent('paste');

    return (Clipboard = {
        onCopy,
        onPaste,
        copy: (text) => {
            // If no text is provided, return the result of paste()
            if (typeof text === 'undefined') {
                return Clipboard.paste();
            }

            // Use the Async Clipboard API when available
            if (navigator.clipboard) {
                return navigator.clipboard.writeText(text).then(() => {
                    notifyListeners('copy', text); // Notify listeners on successful copy
                    return text;
                })
                    .catch(err => {
                        throw err;
                    });
            }

            // Fallback using document.execCommand()
            const span = document.createElement('span');
            span.textContent = text;
            span.style.whiteSpace = 'pre';
            span.style.webkitUserSelect = 'auto';
            span.style.userSelect = 'all';

            document.body.appendChild(span);

            const selection = window.getSelection();
            const range = window.document.createRange();
            selection.removeAllRanges();
            range.selectNode(span);
            selection.addRange(range);

            let success = false;
            try {
                success = window.document.execCommand('copy');
            } catch (err) {
                console.log('error', err);
            }

            selection.removeAllRanges();
            window.document.body.removeChild(span);

            if (success) {
                notifyListeners('copy', text); // Notify listeners on successful copy
                return Promise.resolve(text);
            } else {
                return Promise.reject(new DOMException('The request is not allowed', 'NotAllowedError'));
            }
        },
        paste: () => {
            // Use the Async Clipboard API when available
            if (navigator.clipboard) {
                return navigator.clipboard.readText().then((text) => {
                    notifyListeners('paste', text); // Notify listeners on successful paste
                    return text;
                }).catch(err => {
                    throw err;
                });
            }

            // Fallback using a <textarea> for environments without the Clipboard API
            return new Promise((resolve, reject) => {
                const textarea = document.createElement('textarea');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.focus();

                const success = document.execCommand('paste');
                const text = textarea.value;

                document.body.removeChild(textarea);

                if (success) {
                    notifyListeners('paste', text); // Notify listeners on successful paste
                    resolve(text);
                } else {
                    reject(new DOMException('The request is not allowed', 'NotAllowedError'));
                }
            });
        }
    });
});


/* https://chatgpt.com/c/6751dd85-bbe0-8006-a0f2-10713f6028e3?model=gpt-4o-canmore */
