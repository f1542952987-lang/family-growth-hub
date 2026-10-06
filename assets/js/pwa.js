(() => {
  'use strict';
  const base = new URL('../../', document.currentScript.src);
  let promptEvent;
  let registration;
  let refreshing = false;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const host = document.querySelector('.hero') || document.body;
  const install = document.createElement('button');
  install.type = 'button';
  install.className = 'btn';
  install.textContent = '安装到主屏幕 / 桌面';
  install.hidden = standalone();
  const status = document.createElement('p');
  status.className = 'muted';
  status.setAttribute('role', 'status');
  host.append(install, status);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    install.hidden = standalone();
  });
  window.addEventListener('appinstalled', () => {
    promptEvent = null;
    install.hidden = true;
    status.textContent = '已安装，可从主屏幕或桌面打开。';
  });
  install.addEventListener('click', async () => {
    if (!isSecureContext) {
      status.textContent = '请使用 HTTPS 网站地址安装，不能从本地文件安装。';
    } else if (promptEvent) {
      const event = promptEvent;
      promptEvent = null;
      try { await event.prompt(); await event.userChoice; }
      catch { status.textContent = '请使用浏览器菜单中的安装选项。'; }
    } else {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      status.textContent = ios
        ? '在 Safari 中打开：分享 → 添加到主屏幕。'
        : '在 Chrome / Edge 的菜单中选择“安装应用”或“添加到主屏幕”；若尚未出现，请联网刷新后再试。';
    }
  });
  if (!isSecureContext || !('serviceWorker' in navigator)) return;
  const update = document.createElement('button');
  update.type = 'button';
  update.className = 'btn';
  update.textContent = '更新并重新打开';
  update.hidden = true;
  host.append(update);
  const offerUpdate = () => {
    if (!registration.waiting) return;
    update.hidden = false;
    status.textContent = '新版本已准备好，请暂停播放、保存编辑后更新。';
  };
  update.addEventListener('click', () => {
    if (registration.waiting) {
      refreshing = true;
      registration.waiting.postMessage({type: 'SKIP_WAITING'});
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) location.reload();
  });
  const register = async () => {
    try {
      registration = await navigator.serviceWorker.register(new URL('sw.js', base), {
        scope: base.pathname, updateViaCache: 'none'
      });
      offerUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate();
        });
      });
      await registration.update();
    } catch (error) {
      status.textContent = '离线功能暂未准备好，请联网刷新重试。';
      console.error('PWA registration failed', error);
    }
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, {once: true});
})();
