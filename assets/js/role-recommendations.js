window.FamilyHubRoleRecommendations=(function(){
var picks={
dad:[['怎么和妻子好好说话','夫妻沟通先行'],['少一点烟酒，多一点健康','健康风险先做小改变'],['金钱心理学','家庭储蓄与长期选择'],['50岁以后继续成长','中后半生健康、关系和养老']],
mom:[['做妈妈，也做自己','先把自己重新放回生活'],['怎么和丈夫好好沟通','把委屈变成具体请求'],['家常饮食与健康生活','把健康落到每天三餐'],['50岁以后继续成长','为后半生提前做准备']],
bro:[['学习和玩怎么平衡','自由和责任一起增长'],['把青少年生活变丰富','生活不只剩学校和手机'],['青春萌动与喜欢一个人','喜欢、边界、拒绝和安全'],['解码青春期','理解自己正在发生的变化']],
me:[['职场成长：从执行到分析','把一线经验变成分析能力'],['20几岁女生的AI学习路线','把AI接进真实工作流'],['专注力与高效学习','减少计划多、启动少'],['减少内耗与情绪困扰','把注意力拉回可控行动']]
};
function escHtml(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function escJs(s){return String(s).replaceAll("'","\\'")}
function currentRole(){try{return FamilyHubStorage.role()}catch(e){return'me'}}
function render(){var home=document.getElementById('home');if(!home)return;var role=currentRole(),list=picks[role]||[],old=document.getElementById('roleRecommendations');if(old)old.remove();var box=document.createElement('div');box.id='roleRecommendations';box.className='card';box.style.margin='12px 0';box.innerHTML='<h3>⭐ 今天优先听</h3><p class="muted">按这个身份最值得先听的顺序推荐。点一下直接从第1节连续播放。</p><div class="grid">'+list.map(function(x){return '<button class="card" onclick="playCourse(\''+escJs(x[0])+'\',0,\'long\')"><b>▶ 《'+escHtml(x[0])+'》</b><br><span class="muted">'+escHtml(x[1])+' · 🎙️重点精修</span></button>'}).join('')+'</div>';var resume=document.getElementById('resume');if(resume&&resume.parentNode===home)home.insertBefore(box,resume.nextSibling);else home.appendChild(box)}
function reorder(){var books=document.getElementById('books');if(!books)return;var list=(picks[currentRole()]||[]).map(function(x){return x[0]}),cards=[].slice.call(books.children);cards.sort(function(a,b){function rank(c){var h=c.querySelector('h3'),t=h?h.textContent.replace(/[《》]/g,''):'';var i=list.indexOf(t);return i<0?999:i}return rank(a)-rank(b)});cards.forEach(function(c){books.appendChild(c)})}
function refresh(){setTimeout(function(){render();reorder()},60)}
function wrapRole(){if(!window.setRole||window.setRole.__fhWrapped)return;var original=window.setRole;var wrapped=function(r){original(r);refresh()};wrapped.__fhWrapped=true;window.setRole=wrapped}
window.addEventListener('load',function(){setTimeout(function(){wrapRole();render();var books=document.getElementById('books');if(books)new MutationObserver(function(){reorder()}).observe(books,{childList:true});reorder()},250)});document.addEventListener('familyhub-depth-updated',refresh);return{render:render,reorder:reorder,picks:picks};
})();