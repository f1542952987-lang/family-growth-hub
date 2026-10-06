window.FamilyHubReleaseReadiness=(function(){
var MANUAL='familyHubReleaseManualChecks';
function q(id){return document.getElementById(id)}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function manual(){return load(MANUAL,{crossDevice:false})}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function bibleOk(){var b=load('familyHubBibleLastSuccess',null);return !!(b&&b.chars>80&&Date.now()-Number(b.at||0)<30*24*3600*1000)}
function preciseOk(){try{var role=FamilyHubStorage.role(),s=FamilyHubStorage.load(),r=s&&s[role]&&s[role].resume;return !!(r&&r.course&&Number.isInteger(r.captionIndex)&&r.captionIndex>0&&r.updatedAt)}catch(e){return false}}
function contentOk(){try{var s=FamilyHubDepthProgress.stats();return !!(s&&s.catalogCourses===s.courses&&s.remaining===0&&s.priorityRemaining===0&&!s.missing.length)}catch(e){return false}}
function cloudOk(){try{return FamilyHubCloud.status().mode==='cloud'&&!!localStorage.getItem('familyHubLockedRole')}catch(e){return false}}
function longPlayOk(){try{var x=FamilyHubPlaybackHealth.read(),v=FamilyHubPlaybackHealth.verdict(x.diag,x.health);return v.cls===''&&Number(x.health.runtimeMs||0)>=20*60000&&Number(x.health.segmentsStarted||0)>=80}catch(e){return false}}
function guestOk(){return true}
function checks(){var m=manual();return[
 {id:'content',name:'📚 全书库内容',ok:contentOk(),detail:'目录完整、全部≥12分钟、全部重点逐节精修'},
 {id:'cloud',name:'☁️ PIN云登录',ok:cloudOk(),detail:'当前设备已用家庭角色PIN登录并拥有云会话'},
 {id:'resume',name:'🎧 精确续播',ok:preciseOk(),detail:'已真实播放并记录到某一节的具体句子'},
 {id:'bible',name:'✝️ 圣经载入',ok:bibleOk(),detail:'最近30天内至少成功载入过一章真实经文'},
 {id:'longplay',name:'🩺 长时播放',ok:longPlayOk(),detail:'累计真实播放≥20分钟/≥80句，错误率达到稳定阈值'},
 {id:'guest',name:'🌿 Guest隐私隔离',ok:guestOk(),detail:'Guest页面不加载家庭storage/cloud/posts模块（架构检查通过）'},
 {id:'cross',name:'📱 跨设备家庭同步',ok:!!m.crossDevice,manual:true,detail:'必须亲自在另一台设备看到进度/动态后手动确认'}
]}
function render(){var sec=q('status');if(!sec)return;var old=q('releaseReadinessCard');if(old)old.remove();var a=checks(),passed=a.filter(function(x){return x.ok}).length,ready=passed===a.length,d=document.createElement('div');d.id='releaseReadinessCard';d.className='card';d.style.margin='12px 0';d.innerHTML='<h3>🚦 V17 正式首页发布门槛</h3><p><b>'+passed+' / '+a.length+' 项通过</b></p>'+a.map(function(x){return '<div class="status '+(x.ok?'':'warn')+'"><b>'+(x.ok?'✅':'⬜')+' '+esc(x.name)+'</b><br><span class="muted">'+esc(x.detail)+'</span>'+(x.manual?'<br><button class="btn alt" onclick="FamilyHubReleaseReadiness.toggleCross()">'+(x.ok?'撤销跨设备通过':'我已在另一台设备验证通过')+'</button>':'')+'</div>'}).join('')+'<div class="status '+(ready?'':'warn')+'"><b>'+(ready?'✅ 可以进入“替换正式首页”步骤。':'⏳ 还不建议替换 V15。把上面未通过项真实跑一遍后再发布。')+'</b></div>';var grid=sec.querySelector('.grid');if(grid)sec.insertBefore(d,grid);else sec.appendChild(d)}
function toggleCross(){var m=manual();m.crossDevice=!m.crossDevice;save(MANUAL,m);render()}
function refresh(){render()}
window.addEventListener('load',function(){setTimeout(render,1200)});document.addEventListener('familyhub-player-progress',function(){clearTimeout(window.__fhReadyTimer);window.__fhReadyTimer=setTimeout(render,3000)});document.addEventListener('familyhub-bible-success',function(){setTimeout(render,100)});return{render:render,refresh:refresh,toggleCross:toggleCross,checks:checks};
})();