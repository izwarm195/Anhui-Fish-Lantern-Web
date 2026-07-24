export function createNavigation({
    container,
    items,
    onSelect
}) {
    if (!container) {
        throw new Error('缺少导航容器');
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'nav-wrapper';

    const trigger = document.createElement('button');
    trigger.className = 'nav-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', '打开鱼灯信息导航');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span aria-hidden="true">鱼</span>';

    const menu = document.createElement('div');
    menu.className = 'nav-menu';

    Object.entries(items).forEach(([key, item]) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'nav-item';
        button.dataset.topic = key;
        button.textContent = item.title;

        button.addEventListener('click', () => {
            onSelect?.(key);
            trigger.setAttribute('aria-expanded', 'false');
            wrapper.classList.remove('is-open');
        });

        menu.appendChild(button);
    });

    trigger.addEventListener('click', () => {
        const isOpen = wrapper.classList.toggle('is-open');

        trigger.setAttribute(
            'aria-expanded',
            String(isOpen)
        );
    });

    wrapper.addEventListener('mouseenter', () => {
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
    });

    wrapper.addEventListener('mouseleave', () => {
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
    });

    wrapper.append(trigger, menu);
    container.appendChild(wrapper);

    return {
        element: wrapper,
        open() {
            wrapper.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
        },
        close() {
            wrapper.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    };
}
