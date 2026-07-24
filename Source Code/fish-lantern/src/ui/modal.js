export function createModal({ container }) {
    if (!container) {
        throw new Error('缺少信息弹窗容器');
    }

    container.innerHTML = `
        <div
            class="info-overlay"
            role="dialog"
            aria-modal="true"
            aria-hidden="true"
            aria-labelledby="info-title"
        >
            <article class="info-card">
                <button
                    class="info-close"
                    type="button"
                    aria-label="关闭信息弹窗"
                >
                    &times;
                </button>

                <h2 id="info-title"></h2>
                <p class="info-body"></p>
            </article>
        </div>
    `;

    const overlay = container.querySelector('.info-overlay');
    const closeButton = container.querySelector('.info-close');
    const title = container.querySelector('#info-title');
    const body = container.querySelector('.info-body');

    let previouslyFocusedElement = null;

    function open(content) {
        if (!content) {
            return;
        }

        previouslyFocusedElement = document.activeElement;

        title.textContent = content.title;
        body.textContent = content.body;

        overlay.classList.add('is-active');
        overlay.setAttribute('aria-hidden', 'false');

        closeButton.focus();
    }

    function close() {
        overlay.classList.remove('is-active');
        overlay.setAttribute('aria-hidden', 'true');

        previouslyFocusedElement?.focus?.();
    }

    closeButton.addEventListener('click', close);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (
            event.key === 'Escape' &&
            overlay.classList.contains('is-active')
        ) {
            close();
        }
    });

    return {
        open,
        close,
        element: overlay
    };
}
