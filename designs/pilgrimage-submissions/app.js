const $=s=>document.querySelector(s), modal=$('#submission'), body=$('#body');
let lang='zh',mode='new',step=0,photos=[],data={},selected=new Set(['location']),error='',verified=false,done=false,lastFocus;
const drafts={};
const tx=(zh,ja)=>lang==='zh'?zh:ja;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function field(key,label,placeholder='',required=false,area=false){return `<div class="field"><label for="${key}">${label}<span class="${required?'required':'optional'}">${required?tx('必填','必須'):tx('选填','任意')}</span></label><${area?'textarea':'input'} id="${key}" name="${key}" ${area?'rows="3"':'type="'+(key==='email'?'email':'text')+'"'} maxlength="${area?5000:500}" placeholder="${placeholder}">${area?escape(data[key]):''}${area?'</textarea>':''}${!area?'':''}</div>`}
function inputMarkup(key,label,placeholder,required=false,area=false){return field(key,label,placeholder,required,area)}
const labels={location:()=>tx('位置 / 地址','場所・住所'),title:()=>tx('地点名称','場所の名前'),work:()=>tx('关联作品','関連作品'),description:()=>tx('地点说明','場所の説明'),photo:()=>tx('补充照片','写真を追加')};
function save(){body.querySelectorAll('[name]').forEach(el=>data[el.name]=el.type==='checkbox'?el.checked:el.value)}
function target(){return `<div class="target"><div><span>${tx('正在补充的地点','情報を追加する場所')}</span><strong>${tx('沿河步道','川沿いの遊歩道')}</strong><p>東京都 · 目黒エリア</p></div><span>${tx('地点已关联<br>无需重新选择','場所は選択済みです')}</span></div>`}
function render(){
 $('#modal-title').textContent=mode==='new'?tx('提供新的巡礼地点','新しい巡礼スポットを紹介'):tx('补充 / 纠正地点信息','場所の情報を追加・修正');
 $('#modal-subtitle').textContent=tx('用你熟悉的语言分享，整理与核实交给我们。','使いやすい言葉で教えてください。整理と確認は私たちが行います。');
 $('#close').ariaLabel=tx('关闭','閉じる');
 const names=[mode==='new'?tx('地点与线索','場所と手がかり'):tx('选择纠正项目','変更する情報'),tx('照片与补充','写真と補足'),tx('预览确认','内容の確認')];
 $('#steps').innerHTML=names.map((n,i)=>`<div class="step ${step===i?'active':step>i?'done':''}" ${step===i?'aria-current="step"':''}><b>${step>i?'✓':i+1}</b><span>${n}</span></div>`).join('');
 $('#footnote').textContent=tx('投稿内容经审核后才会公开','投稿内容は確認後に公開されます');
 $('#back').textContent=step?tx('上一步','戻る'):tx('暂时关闭','閉じる');
 $('#next').textContent=done?tx('返回地图','マップに戻る'):step===2?tx('模拟提交','送信を試す'):tx('下一步 →','次へ →');
 $('#back').hidden=done;$('#steps').hidden=done;
 if(done){body.innerHTML=`<div class="success"><div class="seal">✓</div><h3>${tx('谢谢你，让地图更完整','マップへのご協力、ありがとうございます')}</h3><p>${tx('正式接入后，投稿将在这里进入待审核状态。','接続後は、ここから確認待ちになります。')}</p><small>${tx('演示完成 · 没有上传或提交任何数据','デモ完了 · データは送信されていません')}</small><p>${tx('采纳的信息会更新到巡礼地点中。','採用された情報は、巡礼スポットに反映されます。')}</p></div>`;return}
 let h=error?`<div class="error" role="alert">${escape(error)}</div>`:'';
 if(step===0){
  if(mode==='update')h+=target()+`<h3 class="section-title">${tx('你想补充或纠正什么？','どの情報を追加・修正しますか？')}</h3><p class="hint">${tx('可以多选，只需填写你想修改的部分。','複数選択できます。変更したい情報だけ入力してください。')}</p><div class="chips">${Object.keys(labels).map(k=>`<button type="button" data-chip="${k}" aria-pressed="${selected.has(k)}">${selected.has(k)?'✓ ': '＋ '}${labels[k]()}</button>`).join('')}</div>`;
  else h+=`<p class="section-label">01 / ${tx('从一个地点开始','場所からはじめる')}</p>`;
  if(mode==='new'||selected.has('title'))h+=inputMarkup('title',tx('地点名称','場所の名前'),tx('例如：河边的步道、某家咖啡店','例：川沿いの遊歩道、カフェの名前'),true);
  if(mode==='new'||selected.has('location'))h+=inputMarkup('map',tx('地图分享链接','地図の共有リンク'),tx('粘贴 Google 地图 / 高德地图的分享链接','Google マップなどの共有リンクを貼り付け'))+`<p class="hint" style="margin-top:-10px;margin-bottom:16px">${tx('在地图中打开地点 → 分享 → 复制链接。不需要填写经纬度。','地図で場所を開く → 共有 → リンクをコピー。緯度・経度の入力は不要です。')}</p>`+inputMarkup('address',tx('地址或位置说明','住所・場所の説明'),tx('没有地图链接？写下你知道的位置也可以','リンクがなくても、わかる範囲の場所を教えてください'));
  if(mode==='new'||selected.has('work'))h+=inputMarkup('work',tx('关联作品','関連作品'),tx('例如：作品名 / MV / 公开活动','例：曲名・MV・公開イベント'));
  if(mode==='update'&&selected.has('description'))h+=inputMarkup('proposed',tx('建议的地点说明','新しい場所の説明'),tx('写下希望补充或修改的说明','追加・修正したい説明を入力'),true,true);
  h+=inputMarkup('reason',mode==='new'?tx('你发现了什么？','どんな場所ですか？'):tx('补充 / 纠正说明','追加・修正の理由'),mode==='new'?tx('它与 milet 有什么关联？例如 MV 中出现的片段。','milet との関わりや、MV の登場シーンなど。'):tx('告诉我们哪里需要调整，或照片记录了什么。','変更の理由や、写真に写っている内容を教えてください。'),true,true);
 }
 if(step===1){
  h+=`<h3 class="section-title">${tx('让线索更容易被确认','手がかりを、もう少し')}</h3><p class="hint">${tx('链接或文字说明，提供其中一种即可。实地发现也可以直接说明。','リンクか説明のどちらかをご記入ください。現地での発見でも大丈夫です。')}</p><div style="height:16px"></div>`+inputMarkup('source',tx('参考来源链接','参考リンク'),tx('作品、官方动态或其他可核实的来源','作品や公式投稿などのリンク'))+inputMarkup('evidence',tx('出处 / 实地说明','出典・現地での確認内容'),tx('例如：MV 02:31；或何时在现场确认了这条信息','例：MV の 02:31、現地で確認した内容'),false,true);
  h+=`<hr class="separator"><h3 class="section-title">${tx('照片','写真')} <span class="optional">${tx('选填','任意')} · ${photos.length}/5</span></h3><p class="hint">${tx('现场照片可以申请公开；作品截图等请选择「仅供核实」。','現地写真は公開用に。作品のスクリーンショットなどは「確認用」を選んでください。')}</p><div id="photos">${photos.map((p,i)=>`<div class="photo"><img src="${p.url}" alt="${tx('所选照片预览','選択した写真')}"><div><strong>${escape(p.name)}</strong><p>${tx('本地预览 · 未上传','ローカルプレビュー · 未送信')}</p><select aria-label="${tx('照片用途','写真の用途')}" data-purpose="${i}"><option value="publish" ${p.purpose==='publish'?'selected':''}>${tx('可公开照片','公開用の写真')}</option><option value="reference" ${p.purpose==='reference'?'selected':''}>${tx('仅供核实，不公开','確認用・非公開')}</option></select><input aria-label="${tx('照片说明','写真の説明')}" data-caption="${i}" value="${escape(p.caption)}" placeholder="${tx('照片说明（选填）','写真の説明（任意）')}"></div><button class="icon" type="button" data-remove="${i}" aria-label="${tx('移除照片','写真を削除')}">×</button></div>`).join('')}</div><div class="upload"><span class="plus">＋</span><strong>${tx('添加照片，或拖放到这里','写真を追加、またはここにドロップ')}</strong><span class="hint">JPEG / PNG / WebP · ${tx('最多 5 张，每张原图 20 MB','最大5枚、1枚20 MBまで')}</span><button type="button" id="choose">${tx('选择本地照片','写真を選ぶ')}</button><input id="files" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></div><p class="hint">${tx('正式接入后：照片会在设备上自动处理，转换期间可以继续填写。','接続後：写真は端末上で自動処理されます。処理中も入力を続けられます。')}</p><hr class="separator"><div class="grid">${inputMarkup('nickname',tx('怎么称呼你','お名前'),tx('不填则匿名','空欄で匿名'))}${inputMarkup('email',tx('联系邮箱','メールアドレス'),tx('仅在需要核实时联系，不公开','確認が必要な場合のみ使用・非公開'))}</div>`;
 }
 if(step===2){
  h+=`<p class="section-label">${tx('最后看一眼，再交给我们','送信前に、もう一度')}</p><h3 class="section-title">${tx('确认你的投稿','投稿内容の確認')}</h3>`+(mode==='update'?target():'');
  const rows=[[tx('投稿类型','種類'),mode==='new'?tx('新增地点','新しい場所'):tx('补充 / 纠正信息','情報の追加・修正')],...(mode==='update'?[[tx('修改项目','変更項目'),[...selected].map(k=>labels[k]()).join('、')]]:[]),[tx('地点名称','場所の名前'),data.title],[tx('地图链接','地図リンク'),data.map],[tx('地址','住所'),data.address],[tx('关联作品','関連作品'),data.work],[tx('建议说明','新しい説明'),data.proposed],[tx('投稿说明','説明'),data.reason],[tx('参考来源','参考情報'),data.source||data.evidence],[tx('补充出处','補足'),data.source&&data.evidence],[tx('照片','写真'),photos.length?`${photos.length} ${tx('张','枚')} · ${photos.filter(p=>p.purpose==='reference').length} ${tx('张仅供核实','枚は確認用')}`:tx('未添加','なし')],[tx('投稿者','投稿者'),data.nickname||tx('匿名','匿名')],[tx('联系邮箱','メール'),data.email]];
  h+=`<dl class="review">${rows.filter(r=>r[1]).map(([k,v])=>`<div class="review-row"><dt>${k}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl><div class="note">${tx('提交后由管理员核实与整理，不会直接覆盖现有地点。邮箱与仅供核实的图片不会公开。','管理者が確認・整理します。既存の情報が直接上書きされることはありません。メールと確認用写真は公開されません。')}</div><label class="check"><input type="checkbox" name="consent"><span>${tx('我确认所提供的信息真实可靠；如提供可公开照片，我拥有相应的展示授权。','提供した情報が正確であること、公開用写真の掲載権限があることを確認します。')}</span></label><label class="check"><input type="checkbox" id="verify"><span>${tx('体验真人验证完成状态（仅演示）','本人確認の完了状態を試す（デモのみ）')}</span></label>`;
 }
 if(step===2&&photos.length)h+=`<div class="review-photos">${photos.map(p=>`<div class="photo"><img src="${p.url}" alt="${tx('投稿照片','投稿写真')}"><div><strong>${escape(p.caption||p.name)}</strong><p>${p.purpose==='reference'?tx('仅供核实，不公开','確認用・非公開'):tx('可公开照片','公開用の写真')}</p></div></div>`).join('')}</div>`;
 body.innerHTML=h;
 body.querySelectorAll('[name]').forEach(el=>{if(el.type==='checkbox')el.checked=!!data[el.name];else el.value=data[el.name]||''});
 if($('#verify')){$('#verify').checked=verified;$('#verify').onchange=e=>verified=e.target.checked}
 body.querySelectorAll('[data-chip]').forEach(b=>b.onclick=()=>{save();const k=b.dataset.chip;selected.has(k)?selected.delete(k):selected.add(k);const keys={location:['map','address'],title:['title'],work:['work'],description:['proposed']};if(!selected.has(k))(keys[k]||[]).forEach(f=>delete data[f]);render()});
 body.querySelectorAll('[data-purpose]').forEach(el=>el.onchange=()=>photos[+el.dataset.purpose].purpose=el.value);
 body.querySelectorAll('[data-caption]').forEach(el=>el.oninput=()=>photos[+el.dataset.caption].caption=el.value);
 body.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{save();URL.revokeObjectURL(photos[+el.dataset.remove].url);photos.splice(+el.dataset.remove,1);render()});
 if($('#choose')){$('#choose').onclick=()=>$('#files').click();$('#files').onchange=e=>addFiles(e.target.files);const drop=$('.upload');drop.ondragover=e=>e.preventDefault();drop.ondrop=e=>{e.preventDefault();addFiles(e.dataTransfer.files)}}
}
function addFiles(files){save();error='';for(const f of files){if(photos.length>=5){error=tx('每次最多添加 5 张照片。','写真は5枚までです。');break}if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>20*1024*1024){error=tx('请选择 20 MB 以内的 JPEG、PNG 或 WebP 图片。','20 MB 以下の JPEG・PNG・WebP を選択してください。');continue}photos.push({name:f.name,url:URL.createObjectURL(f),purpose:'publish',caption:''})}render()}
function valid(){if(step===0){if(mode==='update'&&!selected.size)return tx('请至少选择一个补充项目。','変更項目を選択してください。');if((mode==='new'||selected.has('title'))&&!data.title?.trim())return tx('请填写地点名称。','場所の名前をご記入ください。');if((mode==='new'||selected.has('location'))&&!data.map?.trim()&&!data.address?.trim())return tx('请提供地图链接，或填写地址 / 位置说明。','地図リンク、または住所・場所をご記入ください。');if(!data.reason?.trim())return tx('请说明你发现的线索或需要纠正的内容。','手がかりや修正理由をご記入ください。')}
 if(step===1&&!data.source?.trim()&&!data.evidence?.trim())return tx('请提供参考来源链接或出处说明。','参考リンクか出典をご記入ください。');
 for(const k of step===0?['map']:step===1?['source']:[]){if(data[k]){try{if(!['http:','https:'].includes(new URL(data[k]).protocol))throw 0}catch{return tx('请填写有效的 http / https 链接。','有効な http / https リンクをご記入ください。')}}}
 if(step===1&&data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return tx('请检查邮箱格式。','メールアドレスをご確認ください。');
 if(step===2&&(!data.consent||!verified))return tx('请确认投稿声明，并勾选演示验证状态。','確認事項とデモの本人確認にチェックしてください。');return ''}
$('#submission-form').onsubmit=e=>{e.preventDefault();if(done){modal.close();return}save();error=valid();if(!error){if(step===2)done=true;else step++}render();body.scrollTop=0;body.querySelector('.error')?.setAttribute('tabindex','-1');body.querySelector('.error')?.focus()};
$('#back').onclick=()=>{save();if(step){step--;error='';render();body.scrollTop=0}else requestClose()};
function requestClose(){save();if(done){modal.close();return}$('#leave-title').textContent=tx('暂时离开？','いったん閉じますか？');$('#leave-copy').textContent=tx('填写的内容会保留在当前页面，刷新后将清空。','入力内容はこのページに残ります。再読み込みすると消去されます。');$('#stay').textContent=tx('继续填写','入力を続ける');$('#leave-now').textContent=tx('暂时关闭','閉じる');$('#leave').showModal()}
$('#close').onclick=requestClose;modal.addEventListener('cancel',e=>{e.preventDefault();requestClose()});$('#stay').onclick=()=>$('#leave').close();$('#leave-now').onclick=()=>{$('#leave').close();modal.close()};
modal.addEventListener('close',()=>{drafts[mode]={data,photos,step,selected,verified,done};lastFocus?.focus()});
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{lastFocus=b;mode=b.dataset.open;const d=drafts[mode];data=d?.data||{};photos=d?.photos||[];step=d?.done?0:d?.step||0;selected=d?.selected||new Set(['location']);verified=false;done=false;error='';render();modal.showModal()});
$('#language').onclick=()=>{if(modal.open)save();lang=lang==='zh'?'ja':'zh';document.documentElement.lang=lang;$('#language').textContent=lang==='zh'?'日本語':'中文';document.querySelector('[data-open=new]').textContent=tx('＋ 提供新地点','＋ 新しい場所を知らせる');document.querySelector('[data-open=update]').textContent=tx('补充 / 纠正信息 ↗','情報を追加・修正 ↗');if(modal.open)render()};
document.querySelector('[data-open=new]').click();
