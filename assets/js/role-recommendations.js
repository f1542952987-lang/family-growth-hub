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
function cardId(title){return 'focus-'+String(title).replace(/[^\w\u3400-\u9fff]+/g,'-')}
function render(){
  var home=document.getElementById('home');if(!home)return;
  var role=currentRole(),list=picks[role]||[],old=document.getElementById('roleRecommendations');if(old)old.remove();
  var box=document.createElement('div');box.id='roleRecommendations';box.className='card';box.style.margin='12px 0';
  box.innerHTML='<h3>⭐ 重点提升 · 今天优先学</h3><p class="muted">可以整门连续听，也可以展开到每一章，单独听或精读正文。</p><div class="grid">'+list.map(function(x){
    var id=cardId(x[0]);
    return '<div class="card focusCourse"><b>《'+escHtml(x[0])+'》</b><br><span class="muted">'+escHtml(x[1])+' · 🎙️重点精修</span><div class="focusActions"><button class="btn" onclick="playCourse(\''+escJs(x[0])+'\',0,\'long\')">▶ 整门连续播放</button><button class="btn alt" onclick="FamilyHubRoleRecommendations.toggleChapters(\''+escJs(x[0])+'\',\''+id+'\')">📚 按章节学习</button></div><div class="focusChapters" id="'+id+'"></div></div>'
  }).join('')+'</div>';
  var resume=document.getElementById('resume');if(resume&&resume.parentNode===home)home.insertBefore(box,resume.nextSibling);else home.appendChild(box)
}
function toggleChapters(title,id){
  var box=document.getElementById(id);if(!box)return;
  if(box.dataset.open==='1'){box.innerHTML='';box.dataset.open='0';return}
  var lessons=FamilyHubCourses.get(title,'long');box.dataset.open='1';
  box.innerHTML='<div class="focusChapterHead">📚 《'+escHtml(title)+'》章节</div>'+lessons.map(function(x,i){
    var meta=x.complete?('约'+(x.minutes||1)+'分钟 · '+escHtml(x.kind||'')):'正在扩写';
    return '<div class="focusChapter"><div><b>第'+(i+1)+'节 · '+escHtml(x.title)+'</b><br><span class="muted">'+meta+'</span></div>'+(x.complete?'<div class="focusChapterBtns"><button class="btn" onclick="playSingleCourseLesson(\''+escJs(title)+'\','+i+',\'long\')">🎧 只听本章</button><button class="btn alt" onclick="FamilyHubRoleRecommendations.readChapter(\''+escJs(title)+'\','+i+',\''+id+'\')">📖 精读本章</button></div>':'')+'</div>'
  }).join('')
}
function readChapter(title,i,id){
  var lessons=FamilyHubCourses.get(title,'long'),x=lessons[i],host=document.getElementById(id);if(!x||!x.complete||!host)return;
  var old=host.querySelector('.focusReading');if(old)old.remove();
  var read=document.createElement('div');read.className='focusReading';
  read.innerHTML='<div class="focusReadingTop"><div><b>📖 第'+(i+1)+'节 · '+escHtml(x.title)+'</b><br><span class="muted">约'+(x.minutes||1)+'分钟 · 精读模式，不自动播放</span></div><button class="btn alt" onclick="this.closest(\'.focusReading\').remove()">收起</button></div><div class="focusReadingText">'+escHtml(x.text).replace(/\n\n+/g,'</p><p>').replace(/^/,'<p>').replace(/$/,'</p>')+'</div><div class="focusReadingBottom"><button class="btn" onclick="playSingleCourseLesson(\''+escJs(title)+'\','+i+',\'long\')">🎧 听这一章</button></div>';
  host.appendChild(read);read.scrollIntoView({behavior:'smooth',block:'nearest'})
}
function rankCard(card,list){var h=card.querySelector('h3'),t=h?h.textContent.replace(/[《》]/g,''):'';var i=list.indexOf(t);return i<0?999:i}
function reorder(){var books=document.getElementById('books');if(!books)return;var list=(picks[currentRole()]||[]).map(function(x){return x[0]}),cards=[].slice.call(books.children),sorted=cards.slice().sort(function(a,b){return rankCard(a,list)-rankCard(b,list)});var changed=sorted.some(function(c,i){return cards[i]!==c});if(!changed)return;var frag=document.createDocumentFragment();sorted.forEach(function(c){frag.appendChild(c)});books.appendChild(frag)}
function refresh(){setTimeout(function(){render();reorder()},60)}
function wrapRole(){if(!window.setRole||window.setRole.__fhRoleRecWrapped)return;var original=window.setRole;var wrapped=function(r){var out=original(r);refresh();return out};wrapped.__fhRoleRecWrapped=true;window.setRole=wrapped}
function wrapLibrary(){if(!window.renderLibrary||window.renderLibrary.__fhRoleRecWrapped)return;var original=window.renderLibrary;var wrapped=function(){var out=original.apply(this,arguments);setTimeout(reorder,0);return out};wrapped.__fhRoleRecWrapped=true;window.renderLibrary=wrapped}
window.addEventListener('load',function(){setTimeout(function(){wrapRole();wrapLibrary();render();reorder()},250)});
document.addEventListener('familyhub-depth-updated',refresh);
return{render:render,reorder:reorder,picks:picks,toggleChapters:toggleChapters,readChapter:readChapter};
})();