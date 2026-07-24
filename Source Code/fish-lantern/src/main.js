import './styles/global.css';
import './ui/ui.css';

import { FishLanternScene } from './scene/FishLanternScene.js';
import { createNavigation } from './ui/navigation.js';
import { createModal } from './ui/modal.js';
import { createTitle } from './ui/title.js';
import { fishLanternInfo } from './data/fishLanternInfo.js';

const sceneContainer = document.querySelector('#scene-container');
const navigationContainer = document.querySelector('#site-navigation');
const modalContainer = document.querySelector('#info-modal');
const titleContainer = document.querySelector('#site-title');

const loadingScreen = document.querySelector('#loading-screen');
const loadingText = document.querySelector('#loading-text');
const loadingProgress = document.querySelector('#loading-progress');
const sceneMessage = document.querySelector('#scene-message');

const modal = createModal({
    container: modalContainer
});

createTitle({
    container: titleContainer,
    chinese: '徽 州 鱼 灯',
    english: 'Huizhou Fish Lantern'
});

createNavigation({
    container: navigationContainer,
    items: fishLanternInfo,
    onSelect(topic) {
        const content = fishLanternInfo[topic];

        if (content) {
            modal.open(content);
        }
    }
});

const fishScene = new FishLanternScene(sceneContainer, {
    onProgress(progress, fileName) {
        const percent = Math.round(progress * 100);

        loadingProgress.style.width = `${percent}%`;
        loadingText.textContent = fileName
            ? `正在载入 ${fileName} · ${percent}%`
            : `正在载入鱼灯模型 · ${percent}%`;
    },

    onReady() {
        loadingProgress.style.width = '100%';
        loadingText.textContent = '鱼灯模型加载完成';

        window.setTimeout(() => {
            loadingScreen.classList.add('is-hidden');
        }, 350);
    },

    onPartToggle(detail) {
        const stateText = detail.hidden ? '骨架展示' : '完整裱糊';

        showSceneMessage(`${detail.label}：${stateText}`);
    },

    onError(error) {
        console.error(error);
        loadingText.textContent = '模型加载失败，请检查 public/models 中的文件名';
        loadingScreen.classList.add('has-error');
    }
});

function showSceneMessage(text) {
    sceneMessage.textContent = text;
    sceneMessage.classList.add('is-visible');

    window.clearTimeout(showSceneMessage.timer);

    showSceneMessage.timer = window.setTimeout(() => {
        sceneMessage.classList.remove('is-visible');
    }, 1500);
}

fishScene.init();

window.addEventListener('beforeunload', () => {
    fishScene.destroy();
});
