'use strict';
(() => {
 const menu = document.querySelector('.menu-toggle');
 const navigation = document.querySelector('#navigation');
 if (!menu || !navigation) return;
 function setOpen(open) {
  menu.setAttribute('aria-expanded',String(open));
  menu.setAttribute('aria-label',open ? 'Закрыть меню' : 'Открыть меню');
  navigation.classList.toggle('open',open);
 }
 menu.addEventListener('click',()=>setOpen(menu.getAttribute('aria-expanded')!=='true'));
 navigation.addEventListener('click',(event)=>{if(event.target.closest('a')) setOpen(false)});
 document.addEventListener('keydown',(event)=>{if(event.key==='Escape') setOpen(false)});
})();
