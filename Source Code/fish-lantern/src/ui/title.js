export function createTitle({
    container,
    chinese,
    english
}) {
    if (!container) {
        throw new Error('缺少标题容器');
    }

    container.className = 'site-title';

    const chineseTitle = document.createElement('span');
    chineseTitle.className = 'site-title__cn';
    chineseTitle.textContent = chinese;

    const englishTitle = document.createElement('span');
    englishTitle.className = 'site-title__en';
    englishTitle.textContent = english;

    container.append(chineseTitle, englishTitle);

    return container;
}
